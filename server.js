const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { db, FieldValue } = require('./firebase');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_COLLECTION = 'app_config';
const ADMIN_DOC_ID = 'admin_profile';
const STUDENTS_COLLECTION = 'students';
const ASSESSMENTS_COLLECTION = 'assessments';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const sanitizeUser = (user) => {
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    return safeUser;
};

const serializeValue = (value) => {
    if (!value) {
        return value;
    }

    if (typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }

    return value;
};

const serializeDoc = (doc) => {
    const data = doc.data();
    const serialized = {};

    Object.entries(data).forEach(([key, value]) => {
        serialized[key] = serializeValue(value);
    });

    return { id: doc.id, ...serialized };
};

const getAdminRef = () => db.collection(ADMIN_COLLECTION).doc(ADMIN_DOC_ID);

const getAdminProfile = async () => {
    const snapshot = await getAdminRef().get();

    if (!snapshot.exists) {
        throw new Error('Admin profile is not initialized. Check your Firebase setup and restart the server.');
    }

    return serializeDoc(snapshot);
};

const findStudentByEmail = async (email) => {
    const snapshot = await db
        .collection(STUDENTS_COLLECTION)
        .where('email', '==', normalizeEmail(email))
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return serializeDoc(snapshot.docs[0]);
};

const getAllStudents = async () => {
    const snapshot = await db.collection(STUDENTS_COLLECTION).get();
    const students = snapshot.docs.map(serializeDoc);
    return students.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
};

const getAssessments = async (studentId = null) => {
    let query = db.collection(ASSESSMENTS_COLLECTION);

    if (studentId) {
        query = query.where('studentId', '==', studentId);
    }

    const snapshot = await query.get();
    const assessments = snapshot.docs.map(serializeDoc);
    return assessments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
};

const deleteAssessmentsForStudent = async (studentId) => {
    const snapshot = await db
        .collection(ASSESSMENTS_COLLECTION)
        .where('studentId', '==', studentId)
        .get();

    if (snapshot.empty) {
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
};

const ensureAdminProfile = async () => {
    const adminRef = getAdminRef();
    const snapshot = await adminRef.get();

    if (snapshot.exists) {
        return;
    }

    const seededName = process.env.DEFAULT_ADMIN_NAME || 'D. Sadiq';
    const seededEmail = normalizeEmail(process.env.DEFAULT_ADMIN_EMAIL || 'sadiq123@gmail.com');
    const seededPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'sadiq@2007';
    const passwordHash = await bcrypt.hash(seededPassword, 10);

    await adminRef.set({
        name: seededName,
        email: seededEmail,
        passwordHash,
        role: 'admin',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`Seeded Firebase admin profile for ${seededEmail}`);
};

const buildStudentAnalytics = (studentAssessments) => {
    const subjectsCompleted = new Set(studentAssessments.map((assessment) => assessment.subject)).size;

    let totalScore = 0;
    const subjectScores = {};
    const subjectCounts = {};

    studentAssessments.forEach((assessment) => {
        totalScore += assessment.score;
        subjectScores[assessment.subject] = (subjectScores[assessment.subject] || 0) + assessment.score;
        subjectCounts[assessment.subject] = (subjectCounts[assessment.subject] || 0) + 1;
    });

    const overallAverage = studentAssessments.length > 0
        ? Number((totalScore / studentAssessments.length).toFixed(1))
        : 0;

    const subjectPerformance = Object.keys(subjectScores).map((subject) => ({
        subject,
        average: Number((subjectScores[subject] / subjectCounts[subject]).toFixed(1))
    }));

    return {
        assessmentsCount: studentAssessments.length,
        subjectsCompleted,
        overallAverage,
        subjectPerformance
    };
};

app.post('/api/login', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const adminProfile = await getAdminProfile();
    if (adminProfile.email === email) {
        const isValidAdmin = await bcrypt.compare(password, adminProfile.passwordHash);

        if (!isValidAdmin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        return res.json({
            success: true,
            user: sanitizeUser(adminProfile),
            message: 'Logged in successfully as Admin'
        });
    }

    const student = await findStudentByEmail(email);
    if (!student) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValidStudent = await bcrypt.compare(password, student.passwordHash);
    if (!isValidStudent) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({
        success: true,
        user: sanitizeUser(student),
        message: 'Logged in successfully'
    });
});

app.get('/api/admin', async (req, res) => {
    const adminProfile = await getAdminProfile();
    res.json(sanitizeUser(adminProfile));
});

app.put('/api/admin', async (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email ? normalizeEmail(req.body.email) : null;
    const adminProfile = await getAdminProfile();

    if (email && email !== adminProfile.email) {
        const existingStudent = await findStudentByEmail(email);
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
    }

    const updates = {
        updatedAt: FieldValue.serverTimestamp()
    };

    if (name) {
        updates.name = String(name).trim();
    }

    if (email) {
        updates.email = email;
    }

    if (password) {
        updates.passwordHash = await bcrypt.hash(String(password), 10);
    }

    await getAdminRef().set(updates, { merge: true });
    const updatedAdmin = await getAdminProfile();

    res.json({
        success: true,
        user: sanitizeUser(updatedAdmin),
        message: 'Admin profile updated'
    });
});

app.get('/api/students', async (req, res) => {
    const students = await getAllStudents();
    res.json(students.map(sanitizeUser));
});

app.post('/api/students', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const grade = String(req.body.grade || '').trim();

    if (!name || !email || !password || !grade) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const adminProfile = await getAdminProfile();
    const existingStudent = await findStudentByEmail(email);
    if (adminProfile.email === email || existingStudent) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const studentRef = db.collection(STUDENTS_COLLECTION).doc();
    const passwordHash = await bcrypt.hash(password, 10);

    await studentRef.set({
        name,
        email,
        passwordHash,
        grade,
        role: 'student',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });

    const createdStudent = serializeDoc(await studentRef.get());
    res.status(201).json({
        success: true,
        student: sanitizeUser(createdStudent),
        message: 'Student created successfully'
    });
});

app.put('/api/students/:id', async (req, res) => {
    const studentRef = db.collection(STUDENTS_COLLECTION).doc(req.params.id);
    const snapshot = await studentRef.get();

    if (!snapshot.exists) {
        return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const currentStudent = serializeDoc(snapshot);
    const email = req.body.email ? normalizeEmail(req.body.email) : null;

    if (email && email !== currentStudent.email) {
        const adminProfile = await getAdminProfile();
        const existingStudent = await findStudentByEmail(email);

        if (adminProfile.email === email || (existingStudent && existingStudent.id !== currentStudent.id)) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
    }

    const updates = {
        updatedAt: FieldValue.serverTimestamp()
    };

    if (req.body.name) {
        updates.name = String(req.body.name).trim();
    }

    if (email) {
        updates.email = email;
    }

    if (req.body.grade) {
        updates.grade = String(req.body.grade).trim();
    }

    if (req.body.password) {
        updates.passwordHash = await bcrypt.hash(String(req.body.password), 10);
    }

    await studentRef.set(updates, { merge: true });
    const updatedStudent = serializeDoc(await studentRef.get());

    res.json({
        success: true,
        student: sanitizeUser(updatedStudent),
        message: 'Student updated successfully'
    });
});

app.delete('/api/students/:id', async (req, res) => {
    const studentRef = db.collection(STUDENTS_COLLECTION).doc(req.params.id);
    const snapshot = await studentRef.get();

    if (!snapshot.exists) {
        return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await deleteAssessmentsForStudent(req.params.id);
    await studentRef.delete();

    res.json({ success: true, message: 'Student deleted successfully' });
});

app.get('/api/assessments', async (req, res) => {
    const assessments = await getAssessments(req.query.studentId || null);
    res.json(assessments);
});

app.post('/api/assessments', async (req, res) => {
    const studentId = String(req.body.studentId || '').trim();
    const subject = String(req.body.subject || '').trim();
    const type = String(req.body.type || '').trim();
    const score = Number(req.body.score);

    if (!studentId || !subject || !type || Number.isNaN(score)) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (score < 0 || score > 100) {
        return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' });
    }

    const studentSnapshot = await db.collection(STUDENTS_COLLECTION).doc(studentId).get();
    if (!studentSnapshot.exists) {
        return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const assessmentRef = db.collection(ASSESSMENTS_COLLECTION).doc();
    await assessmentRef.set({
        studentId,
        subject,
        type,
        score,
        createdAt: FieldValue.serverTimestamp()
    });

    const createdAssessment = serializeDoc(await assessmentRef.get());
    res.status(201).json({
        success: true,
        assessment: createdAssessment,
        message: 'Assessment created successfully'
    });
});

app.get('/api/reports', async (req, res) => {
    const studentId = req.query.studentId || null;

    if (studentId) {
        const studentSnapshot = await db.collection(STUDENTS_COLLECTION).doc(studentId).get();
        if (!studentSnapshot.exists) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const studentAssessments = await getAssessments(studentId);
        return res.json(buildStudentAnalytics(studentAssessments));
    }

    const [students, assessments] = await Promise.all([
        getAllStudents(),
        getAssessments()
    ]);

    let totalScore = 0;
    const subjectScores = {};
    const subjectCounts = {};

    assessments.forEach((assessment) => {
        totalScore += assessment.score;
        subjectScores[assessment.subject] = (subjectScores[assessment.subject] || 0) + assessment.score;
        subjectCounts[assessment.subject] = (subjectCounts[assessment.subject] || 0) + 1;
    });

    const subjectAverages = Object.keys(subjectScores).map((subject) => ({
        subject,
        average: Number((subjectScores[subject] / subjectCounts[subject]).toFixed(1))
    }));

    const studentPerformance = students.map((student) => {
        const studentAssessments = assessments.filter((assessment) => assessment.studentId === student.id);
        const totalStudentScore = studentAssessments.reduce((sum, assessment) => sum + assessment.score, 0);
        const average = studentAssessments.length > 0
            ? Number((totalStudentScore / studentAssessments.length).toFixed(1))
            : 0;

        return {
            id: student.id,
            name: student.name,
            grade: student.grade,
            assessmentsTaken: studentAssessments.length,
            average
        };
    });

    res.json({
        totalStudents: students.length,
        totalAssessments: assessments.length,
        overallAverage: assessments.length > 0 ? Number((totalScore / assessments.length).toFixed(1)) : 0,
        subjectsAnalyzed: subjectAverages.length,
        subjectPerformance: subjectAverages,
        studentPerformance
    });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    const message = error.message || 'Internal server error';
    res.status(500).json({ success: false, message });
});

const startServer = async () => {
    await ensureAdminProfile();

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
};

startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});
