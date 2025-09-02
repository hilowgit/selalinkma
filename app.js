// =================================================================================
//  Sila Training Center - Admin Dashboard Logic (Secure Version)
// =================================================================================

const SUPABASE_URL = 'https://jgvibxicmylwvmeubkdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndmlieGljbXlsd3ZtZXVia2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODkyODksImV4cCI6MjA2NjQ2NTI4OX0.xq50DkxFGJrrPQ1VWDob6MMaZW4roNcJNY0xjRw5w_0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =================================================================================
//  DOM Elements
// =================================================================================
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const authErrorDiv = document.getElementById('auth-error');

// =================================================================================
//  Global State & Caches
// =================================================================================
let allCoursesCache = [];
let allCategoriesCache = [];
let allTraineesCache = [];
let allInventoryItemsCache = [];
let allTrainersCache = [];
let selectedCourses = new Map();
let scheduleSelectedTrainees = new Map();
let calendarDate = new Date();
let lastOpenedDetail = { itemId: null, itemName: null };
let currentScheduleCourse = null;

// Modal Instances
let traineeModal, trainerModal, scheduleModal, attendanceModal, confirmModal,
    appointmentModal, inventoryTransactionModal, inventoryDetailModal,
    courseDetailModal, attendanceReportModal, expenseModal, courseEditModal;

// =================================================================================
//  Authentication
// =================================================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        authErrorDiv.textContent = 'البريد الإلكتروني أو كلمة السر غير صحيحة.';
        authErrorDiv.classList.remove('d-none');
    } else {
        authErrorDiv.classList.add('d-none');
        checkUser();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    checkUser();
});

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        initializeApp();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
}

// =================================================================================
//  Utility Functions
// =================================================================================
const showLoader = (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="loader"><div class="spinner-border text-primary" role="status"></div></div>`;
    }
};

let deleteFunction = null;
function confirmDeletion(callback, message) {
    hideAllTooltips();
    document.getElementById('confirmModalText').textContent = message;
    deleteFunction = callback;
    confirmModal.show();
}

const sanitizeData = (data) => {
    for (const key in data) {
        if (data[key] === '' || data[key] === null) data[key] = null;
    }
    return data;
};

function hideAllTooltips() {
    document.querySelectorAll('.tooltip').forEach(tooltip => tooltip.remove());
}

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}


// =================================================================================
//  Trainer Management (XSS Secure)
// =================================================================================
async function fetchTrainers(searchTerm = '') {
    showLoader('trainer-results');
    let query = supabaseClient.from('trainers').select('*').order('full_name');
    if (searchTerm) query = query.ilike('full_name', `%${searchTerm}%`);
    const { data, error } = await query;
    if (error) console.error('Error fetching trainers:', error);
    else displayTrainers(data);
}

function displayTrainers(trainers) {
    const container = document.getElementById('trainer-results');
    container.innerHTML = ''; // Clear container to prevent duplicate content

    if (!trainers || trainers.length === 0) {
        container.innerHTML = `<div class="alert alert-info">لا يوجد مدربين.</div>`;
        return;
    }

    trainers.forEach(trainer => {
        const card = document.createElement('div');
        card.className = 'result-card mb-3';

        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary';
        editBtn.title = 'تعديل';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.onclick = () => openTrainerModal(true, trainer.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.title = 'حذف';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => handleDeleteTrainer(trainer.id, trainer.full_name);

        cardActions.append(editBtn, deleteBtn);

        const title = document.createElement('h5');
        title.innerHTML = '<i class="fas fa-user-tie me-2"></i>';
        title.appendChild(document.createTextNode(trainer.full_name));

        const phone = document.createElement('p');
        phone.className = 'mb-1';
        phone.innerHTML = '<i class="fas fa-phone-alt me-2 text-muted"></i>';
        phone.appendChild(document.createTextNode(trainer.phone || 'N/A'));

        const specialty = document.createElement('p');
        specialty.className = 'mb-1';
        specialty.innerHTML = '<i class="fas fa-briefcase me-2 text-muted"></i>';
        specialty.appendChild(document.createTextNode(trainer.specialty || 'N/A'));
        
        const cv = document.createElement('p');
        cv.className = 'mb-0';
        cv.innerHTML = '<i class="fas fa-file-pdf me-2 text-muted"></i>';
        if (trainer.cv_url) {
            const cvLink = document.createElement('a');
            cvLink.href = trainer.cv_url;
            cvLink.target = '_blank';
            cvLink.textContent = 'عرض السيرة الذاتية';
            cv.appendChild(cvLink);
        } else {
            cv.appendChild(document.createTextNode('لا يوجد'));
        }

        card.append(cardActions, title, phone, specialty, cv);
        container.appendChild(card);
    });
}

async function openTrainerModal(isEdit = false, id = null) {
    hideAllTooltips();
    const form = document.getElementById('trainerForm');
    form.reset();
    document.getElementById('currentCv').textContent = '';
    form.querySelector('[name="id"]').value = '';
    if (isEdit) {
        document.getElementById('trainerModalTitle').textContent = 'تعديل بيانات المدرب';
        const { data, error } = await supabaseClient.from('trainers').select('*').eq('id', id).single();
        if (error) return;
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && key !== 'cv_file') input.value = data[key];
        });
        if (data.cv_url) document.getElementById('currentCv').textContent = `الملف الحالي: ${data.cv_url.split('/').pop()}`;
    } else {
        document.getElementById('trainerModalTitle').textContent = 'إضافة مدرب جديد';
    }
    trainerModal.show();
}

async function handleTrainerFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    let trainerData = Object.fromEntries(formData.entries());
    const id = trainerData.id;
    const cvFile = trainerData.cv_file;
    delete trainerData.cv_file;
    delete trainerData.id;

    if (cvFile && cvFile.size > 0) {
        const fileExt = cvFile.name.split('.').pop();
        const newFileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${newFileName}`;

        const { error: uploadError } = await supabaseClient.storage.from('trainer-cvs').upload(filePath, cvFile);
        if (uploadError) { console.error('Upload Error:', uploadError); Swal.fire('خطأ!', 'حدث خطأ أثناء رفع الملف.', 'error'); return; }
        const { data: urlData } = supabaseClient.storage.from('trainer-cvs').getPublicUrl(filePath);
        trainerData.cv_url = urlData.publicUrl;
    }

    const sanitizedData = sanitizeData(trainerData);
    let response = id ? await supabaseClient.from('trainers').update(sanitizedData).eq('id', id) : await supabaseClient.from('trainers').insert([sanitizedData]);

    if (response.error) { console.error('Error saving trainer:', response.error); Swal.fire('خطأ!', 'لم يتم حفظ البيانات.', 'error');
    } else { Swal.fire('تم!', 'تم الحفظ بنجاح.', 'success'); trainerModal.hide(); fetchTrainers(); }
}

function handleDeleteTrainer(id, name) {
    confirmDeletion(async () => {
        const { error } = await supabaseClient.from('trainers').delete().eq('id', id);
        if (error) Swal.fire('خطأ!', 'لم يتم الحذف.', 'error');
        else { Swal.fire('تم الحذف!', `تم حذف المدرب ${name}.`, 'success'); fetchTrainers(); }
    }, `هل أنت متأكد من حذف المدرب "${name}"؟`);
}

// =================================================================================
//  Trainee Management (XSS Secure)
// =================================================================================
async function fetchTrainees(searchTerm = '') {
    showLoader('trainee-results');
    let query = supabaseClient.from('trainees').select(`*, trainee_enrollments(courses(name))`).order('full_name');
    if (searchTerm) query = query.ilike('full_name', `%${searchTerm}%`);
    const { data, error } = await query;
    if (error) console.error('Error fetching trainees:', error);
    else displayTrainees(data);
}

function displayTrainees(trainees) {
    const container = document.getElementById('trainee-results');
    container.innerHTML = ''; // Clear container

    if (!trainees || trainees.length === 0) {
        container.innerHTML = `<div class="alert alert-info">لا يوجد متدربين.</div>`;
        return;
    }

    trainees.forEach(trainee => {
        const card = document.createElement('div');
        card.className = 'result-card mb-3';

        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.onclick = () => openTraineeModal(true, trainee.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => handleDeleteTrainee(trainee.id, trainee.full_name);

        cardActions.append(editBtn, deleteBtn);

        const title = document.createElement('h5');
        title.innerHTML = '<i class="fas fa-user-graduate me-2"></i>';
        title.appendChild(document.createTextNode(trainee.full_name));

        const phone = document.createElement('p');
        phone.className = 'mb-1';
        phone.innerHTML = '<i class="fas fa-phone-alt me-2 text-muted"></i>';
        phone.appendChild(document.createTextNode(trainee.phone || 'N/A'));

        const coursesP = document.createElement('p');
        coursesP.className = 'mb-0';
        coursesP.innerHTML = '<i class="fas fa-book-open me-2 text-muted"></i><strong>الكورسات:</strong> ';
        
        if (trainee.trainee_enrollments.length > 0) {
            trainee.trainee_enrollments.forEach(e => {
                if (e.courses) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-secondary me-1';
                    badge.textContent = e.courses.name;
                    coursesP.appendChild(badge);
                }
            });
        } else {
            coursesP.appendChild(document.createTextNode('لا يوجد'));
        }

        card.append(cardActions, title, phone, coursesP);
        container.appendChild(card);
    });
}

async function openTraineeModal(isEdit = false, id = null) {
    hideAllTooltips();
    const form = document.getElementById('traineeForm');
    form.reset();
    form.querySelector('[name="id"]').value = id || '';
    selectedCourses.clear();

    if (isEdit) {
        document.getElementById('traineeModalTitle').textContent = 'تعديل بيانات المتدرب';
        const { data: traineeData } = await supabaseClient.from('trainees').select('*, trainee_enrollments(course_id, courses(name))').eq('id', id).single();
        if (!traineeData) return;
        Object.keys(traineeData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = traineeData[key];
        });

        traineeData.trainee_enrollments.forEach(enrollment => {
            if (enrollment.courses) {
                selectedCourses.set(enrollment.course_id, enrollment.courses.name);
            }
        });
    } else {
        document.getElementById('traineeModalTitle').textContent = 'إضافة متدرب جديد';
    }
    renderSelectedCourses();
    traineeModal.show();
}

function renderCourseSearchResults(searchTerm = '') {
    const resultsContainer = document.getElementById('course-search-results-dropdown');
    if (!searchTerm) { resultsContainer.classList.add('d-none'); return; }
    const availableCourses = allCoursesCache.filter(course => !selectedCourses.has(course.id));
    const filtered = availableCourses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const ul = document.createElement('ul');
    ul.className = 'list-group';
    resultsContainer.innerHTML = '';

    if (filtered.length > 0) {
        filtered.forEach(c => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = c.name;
            li.onclick = () => selectCourse(c.id, c.name);
            ul.appendChild(li);
        });
        resultsContainer.appendChild(ul);
        resultsContainer.classList.remove('d-none');
    } else {
        resultsContainer.classList.add('d-none');
    }
}

function selectCourse(id, name) { selectedCourses.set(id, name); document.getElementById('course-search-input').value = ''; document.getElementById('course-search-results-dropdown').classList.add('d-none'); renderSelectedCourses(); }
function removeCourse(id) { selectedCourses.delete(id); renderSelectedCourses(); }

function renderSelectedCourses() {
    const listContainer = document.getElementById('selected-courses-list');
    listContainer.innerHTML = '';
    if (selectedCourses.size > 0) {
        for (const [id, name] of selectedCourses.entries()) {
            const tag = document.createElement('div');
            tag.className = 'selected-tag';
            tag.dataset.id = id;
            tag.textContent = name;
            
            const button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = '&times;';
            button.onclick = () => removeCourse(id);
            
            tag.appendChild(button);
            listContainer.appendChild(tag);
        }
    }
}

async function handleTraineeFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const traineeData = {};
    formData.forEach((value, key) => { traineeData[key] = value; });
    const id = traineeData.id;
    delete traineeData.id;
    const sanitizedData = sanitizeData(traineeData);
    let response = id ? await supabaseClient.from('trainees').update(sanitizedData).eq('id', id).select().single() : await supabaseClient.from('trainees').insert([sanitizedData]).select().single();
    if (response.error) { Swal.fire('خطأ!', 'لم يتم حفظ بيانات المتدرب.', 'error'); return; }
    const traineeId = response.data.id;
    await supabaseClient.from('trainee_enrollments').delete().eq('trainee_id', traineeId);
    if (selectedCourses.size > 0) {
        const enrollmentsToInsert = Array.from(selectedCourses.keys()).map(courseId => ({ trainee_id: traineeId, course_id: courseId }));
        await supabaseClient.from('trainee_enrollments').insert(enrollmentsToInsert);
    }
    Swal.fire('تم!', 'تم الحفظ بنجاح.', 'success'); traineeModal.hide(); fetchTrainees(); fetchSummaryData();
}

function handleDeleteTrainee(id, name) { confirmDeletion(async () => {
    const { error } = await supabaseClient.from('trainees').delete().eq('id', id);
    if (error) Swal.fire('خطأ!', 'لم يتم الحذف.', 'error');
    else { Swal.fire('تم الحذف!', `تم حذف ${name}.`, 'success'); fetchTrainees(); fetchSummaryData(); }
}, `هل أنت متأكد من حذف "${name}"؟`);}


// =================================================================================
//  Schedule Management
// =================================================================================
async function fetchSchedules(searchTerm = '') {
    showLoader('schedule-results');
    let schedulesQuery = supabaseClient.from('schedules').select(`*, courses!inner(id, name, course_categories(name)), trainers(full_name)`).order('status', { ascending: true, nullsFirst: false }).order('start_date', { ascending: false });
    if (searchTerm) { schedulesQuery = schedulesQuery.ilike('courses.name', `%${searchTerm}%`); }
    const { data: schedules, error: schedulesError } = await schedulesQuery;
    if (schedulesError) { console.error('Error fetching schedules:', schedulesError); document.getElementById('schedule-results').innerHTML = `<div class="alert alert-danger">حدث خطأ أثناء جلب المواعيد.</div>`; return; }
    const { data: enrollments, error: enrollmentsError } = await supabaseClient.from('trainee_enrollments').select('course_id');
    if (enrollmentsError) { console.error('Error fetching enrollments:', enrollmentsError); displaySchedules(schedules, new Map()); return; }
    const courseEnrollmentCounts = new Map();
    if (enrollments) {
        for (const enrollment of enrollments) {
            const count = courseEnrollmentCounts.get(enrollment.course_id) || 0;
            courseEnrollmentCounts.set(enrollment.course_id, count + 1);
        }
    }
    displaySchedules(schedules, courseEnrollmentCounts);
}

function displaySchedules(schedules, courseEnrollmentCounts) {
    const container = document.getElementById('schedule-results');
    if (!schedules || schedules.length === 0) { container.innerHTML = `<div class="alert alert-info">لا توجد مواعيد مجدولة تطابق البحث.</div>`; return; }
    const schedulesByCategory = schedules.reduce((acc, schedule) => {
        if (!schedule.courses) { console.warn(`Schedule ID ${schedule.id} is missing course data. Skipping.`); return acc; }
        const category = schedule.courses.course_categories ? schedule.courses.course_categories.name : 'بدون تصنيف';
        if (!acc[category]) { acc[category] = []; }
        acc[category].push(schedule);
        return acc;
    }, {});
    let accordionHTML = '<div class="accordion" id="scheduleAccordion">';
    let categoryIndex = 0;
    for (const category in schedulesByCategory) {
        const categorySchedules = schedulesByCategory[category];
        let categoryTotalStudents = 0;
        const coursesHTML = categorySchedules.map(schedule => {
            const studentCount = schedule.courses ? (courseEnrollmentCounts.get(schedule.courses.id) || 0) : 0;
            categoryTotalStudents += studentCount;
            const isCompleted = schedule.status === 'completed';
            const statusBadge = isCompleted ? `<span class="badge bg-secondary status-badge">منتهي</span>` : `<span class="badge bg-success status-badge">نشط</span>`;
            const safeCourseName = schedule.courses ? schedule.courses.name.replace(/'/g, "\\'") : '';
            return `<div class="result-card mb-3 ${isCompleted ? 'completed' : ''}"><div class="d-flex justify-content-between align-items-start gap-3"><div class="flex-grow-1"><div class="d-flex align-items-center mb-2"><h5 class="m-0"><i class="fas fa-calendar-check me-2"></i>${schedule.courses ? schedule.courses.name : 'N/A'} <span class="text-muted fw-normal">(${studentCount})</span></h5>${statusBadge}</div><p class="mb-1 text-muted small"><i class="fas fa-chalkboard-teacher me-2"></i>${schedule.trainers ? schedule.trainers.full_name : 'N/A'}</p><p class="mb-1 text-muted small"><i class="fas fa-map-marker-alt me-2"></i>${schedule.hall_name || 'N/A'}</p><p class="mb-0 text-muted small"><i class="far fa-clock me-2"></i>${schedule.start_date || '?'} - ${schedule.end_date || '?'}</p></div><div class="d-flex flex-column gap-2 flex-shrink-0"><button class="btn btn-sm btn-success" onclick="openAttendanceModal('${schedule.id}', '${safeCourseName}')" title="أخذ التفقد"><i class="fas fa-user-check"></i></button><button class="btn btn-sm btn-primary" onclick="openScheduleModal(true, '${schedule.id}')" title="تعديل الموعد"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-danger" onclick="handleDeleteSchedule('${schedule.id}', '${safeCourseName}')" title="حذف الموعد"><i class="fas fa-trash"></i></button></div></div></div>`;
        }).join('');
        accordionHTML += `<div class="accordion-item"><h2 class="accordion-header" id="heading-${categoryIndex}"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${categoryIndex}" aria-expanded="true" aria-controls="collapse-${categoryIndex}">${category} <span class="badge bg-primary ms-auto me-2">${categoryTotalStudents} طالب</span></button></h2><div id="collapse-${categoryIndex}" class="accordion-collapse collapse show" aria-labelledby="heading-${categoryIndex}" data-bs-parent="#scheduleAccordion"><div class="accordion-body">${coursesHTML || '<p class="text-muted">لا توجد كورسات في هذا التصنيف.</p>'}</div></div></div>`;
        categoryIndex++;
    }
    accordionHTML += '</div>';
    container.innerHTML = accordionHTML;
}

function toggleScheduleFormLock(isLocked) {
    const form = document.getElementById('scheduleForm');
    const elementsToLock = form.querySelectorAll('.modal-body input:not(#courseStatus), .modal-body select, .modal-body textarea, .modal-body .selected-tag button');
    elementsToLock.forEach(el => { el.disabled = isLocked; });
    const traineeSearchInput = document.getElementById('schedule-trainee-search-input');
    if (traineeSearchInput) { traineeSearchInput.disabled = isLocked; }
}

async function openScheduleModal(isEdit = false, id = null) {
    hideAllTooltips();
    const form = document.getElementById('scheduleForm');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    currentScheduleCourse = null;
    document.getElementById('selected-schedule-course-display').innerHTML = '';
    document.getElementById('selected-schedule-trainer-display').innerHTML = '';
    document.getElementById('schedule-course-search-input').value = '';
    document.getElementById('schedule-trainer-search-input').value = '';
    scheduleSelectedTrainees.clear();
    document.getElementById('schedule-trainee-search-input').value = '';
    if (isEdit) {
        document.getElementById('scheduleModalTitle').textContent = 'تعديل الموعد';
        const { data: scheduleData, error: scheduleError } = await supabaseClient.from('schedules').select('*, courses(id, name, category_id, course_categories(id, name)), trainers(full_name)').eq('id', id).single();
        if (scheduleError || !scheduleData) { console.error("Error fetching schedule for edit", scheduleError); return; }
        Object.keys(scheduleData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (key === 'status') { input.checked = (scheduleData[key] === 'completed');
                } else if(key === 'german_board_applicants' && Array.isArray(scheduleData[key])) { input.value = scheduleData[key].join(', ');
                } else { input.value = scheduleData[key]; }
            }
        });
        if (scheduleData.courses) { selectCourseForSchedule(scheduleData.course_id); }
        if (scheduleData.trainers) { selectTrainerForSchedule(scheduleData.trainer_id, scheduleData.trainers.full_name); }
        if (scheduleData.course_id) {
            const { data: enrollments, error: enrollError } = await supabaseClient.from('trainee_enrollments').select('trainees(id, full_name)').eq('course_id', scheduleData.course_id);
            if (enrollError) console.error("Error fetching enrollments", enrollError);
            else if (enrollments) { enrollments.forEach(e => { if(e.trainees) scheduleSelectedTrainees.set(e.trainees.id, e.trainees.full_name); }); }
        }
        toggleScheduleFormLock(scheduleData.status === 'completed');
    } else {
        document.getElementById('scheduleModalTitle').textContent = 'إضافة موعد جديد';
        toggleScheduleFormLock(false);
    }
    renderScheduleSelectedTrainees();
    scheduleModal.show();
}

async function handleScheduleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    let scheduleData = Object.fromEntries(formData.entries());
    const id = scheduleData.id;
    delete scheduleData.id;
    if (!scheduleData.course_id || !scheduleData.trainer_id) { Swal.fire('تنبيه!', 'الرجاء اختيار كورس ومدرب.', 'warning'); return; }
    scheduleData.status = form.querySelector('[name="status"]').checked ? 'completed' : 'active';
    if (scheduleData.german_board_applicants) scheduleData.german_board_applicants = scheduleData.german_board_applicants.split(',').map(s => s.trim());
    else scheduleData.german_board_applicants = [];
    const sanitizedData = sanitizeData(scheduleData);
    const { data: savedSchedule, error: scheduleError } = id ? await supabaseClient.from('schedules').update(sanitizedData).eq('id', id).select().single() : await supabaseClient.from('schedules').insert([sanitizedData]).select().single();
    if (scheduleError) { console.error(scheduleError); Swal.fire('خطأ!', 'لم يتم حفظ الموعد.', 'error'); return; }
    if (savedSchedule.status !== 'completed') {
        const courseId = savedSchedule.course_id;
        if (!courseId) { Swal.fire('تم!', 'تم حفظ الموعد، ولكن لم يتم تحديد كورس لتحديث قائمة الطلاب.', 'info'); scheduleModal.hide(); fetchSchedules(); return; }
        const { data: currentEnrollmentsData } = await supabaseClient.from('trainee_enrollments').select('trainee_id').eq('course_id', courseId);
        const currentTraineeIds = new Set(currentEnrollmentsData.map(e => e.trainee_id));
        const newTraineeIds = new Set(scheduleSelectedTrainees.keys());
        const traineesToAdd = [...newTraineeIds].filter(tid => !currentTraineeIds.has(tid));
        const traineesToRemove = [...currentTraineeIds].filter(tid => !newTraineeIds.has(tid));
        if (traineesToRemove.length > 0) { await supabaseClient.from('trainee_enrollments').delete().eq('course_id', courseId).in('trainee_id', traineesToRemove); }
        if (traineesToAdd.length > 0) { const enrollmentsToInsert = traineesToAdd.map(traineeId => ({ course_id: courseId, trainee_id: traineeId })); await supabaseClient.from('trainee_enrollments').insert(enrollmentsToInsert); }
    }
    Swal.fire('تم!', 'تم الحفظ بنجاح.', 'success');
    scheduleModal.hide();
    fetchSchedules();
    fetchTrainees();
}

function handleDeleteSchedule(id, name) { confirmDeletion(async () => {
    const { error } = await supabaseClient.from('schedules').delete().eq('id', id);
    if (error) Swal.fire('خطأ!', 'لم يتم الحذف.', 'error');
    else { Swal.fire('تم الحذف!', `تم حذف موعد ${name}.`, 'success'); fetchSchedules(); }
}, `هل أنت متأكد من حذف موعد "${name}"؟`);}

// =================================================================================
//  Summary & Course/Category Management
// =================================================================================
async function fetchSummaryData() {
    showLoader('summary-content');
    const [ { count: traineeCount }, { data: courses, error: coursesError }, { data: enrollments }, { data: categories, error: categoriesError } ] = await Promise.all([
        supabaseClient.from('trainees').select('*', { count: 'exact', head: true }),
        supabaseClient.from('courses').select('*, course_categories(id, name)').order('name'),
        supabaseClient.from('trainee_enrollments').select('course_id, courses(name)'),
        supabaseClient.from('course_categories').select('*').order('name')
    ]);
    if (coursesError) console.error("Error fetching courses", coursesError);
    if (categoriesError) console.error("Error fetching categories", categoriesError);
    allCoursesCache = courses || [];
    allCategoriesCache = categories || [];
    const courseCounts = {};
    if (enrollments) {
        enrollments.forEach(enrollment => {
            if (enrollment.courses) {
                const courseId = enrollment.course_id;
                const courseName = enrollment.courses.name;
                if (!courseCounts[courseId]) { courseCounts[courseId] = { name: courseName, count: 0 }; }
                courseCounts[courseId].count++;
            }
        });
    }
    const popularCourses = Object.entries(courseCounts).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.count - a.count).slice(0, 5);
    document.getElementById('summary-content').innerHTML = `
        <div class="row"><div class="col-lg-4 col-md-6 mb-4"><div class="card text-center h-100 shadow-sm"><div class="card-body p-4 d-flex flex-column justify-content-center"><i class="fas fa-users fa-3x text-primary mb-3"></i><h5 class="card-title h4">إجمالي الطلاب</h5><p class="display-4 fw-bold m-0">${traineeCount || 0}</p></div></div></div><div class="col-lg-8 col-md-6 mb-4"><div class="card h-100 shadow-sm"><div class="card-body p-4"><h5 class="card-title text-center mb-3">الكورسات الأكثر طلباً</h5><div id="popular-courses-list">${popularCourses.length > 0 ? `<ul class="list-group list-group-flush">${popularCourses.map(course => `<li class="list-group-item d-flex justify-content-between align-items-center clickable" onclick="openCourseDetailModal('${course.id}', '${course.name.replace(/'/g, "\\'")}')">${course.name}<span class="badge bg-primary rounded-pill">${course.count}</span></li>`).join('')}</ul>` : '<p class="text-center text-muted">لا توجد بيانات تسجيل لعرضها.</p>'}</div></div></div></div></div>
        <div class="row mt-4"><div class="col-md-6 mb-4 mb-md-0"><div class="card h-100 shadow-sm"><div class="card-body p-4"><h5 class="card-title text-center">إدارة التصنيفات</h5><form id="addCategoryForm" class="d-flex mt-3 mb-3"><input type="text" name="name" class="form-control me-2" placeholder="اسم التصنيف الجديد" required><button type="submit" class="btn btn-success flex-shrink-0">إضافة</button></form><ul id="categoriesList" class="list-group list-group-flush" style="max-height: 250px; overflow-y: auto;"></ul></div></div></div><div class="col-md-6"><div class="card h-100 shadow-sm"><div class="card-body p-4"><h5 class="card-title text-center">إدارة الكورسات</h5><form id="addCourseForm" class="row g-2 mt-3 mb-3 align-items-end"><div class="col-sm-12 mb-2"><label for="newCourseName" class="form-label">اسم الكورس</label><input type="text" id="newCourseName" name="name" class="form-control" required></div><div class="col-sm-12 mb-2"><label for="newCourseCategory" class="form-label">التصنيف</label><select id="newCourseCategory" name="category_id" class="form-select" required></select></div><div class="col-sm-6"><label for="newCoursePrice" class="form-label">السعر للطالب</label><input type="number" id="newCoursePrice" name="price_per_student" class="form-control" required min="0" step="any" value="0"></div><div class="col-sm-6"><label for="newCoursePercentage" class="form-label">نسبة المدرب (%)</label><input type="number" id="newCoursePercentage" name="trainer_percentage" class="form-control" required min="0" max="100" step="1" value="0"></div><div class="col-12 mt-3"><button type="submit" class="btn btn-primary w-100">إضافة كورس</button></div></form><hr><ul id="coursesList" class="list-group list-group-flush" style="max-height: 250px; overflow-y: auto;"></ul></div></div></div></div>`;
    renderCategoriesList();
    renderCoursesList();
    populateCategorySelect('newCourseCategory');
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    document.getElementById('addCourseForm').addEventListener('submit', handleAddCourse);
}

function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;
    if (allCategoriesCache.length > 0) { list.innerHTML = allCategoriesCache.map(cat => `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${cat.name}</span><div><button class="btn btn-sm btn-light py-1 px-2" onclick="handleEditCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')" title="تعديل"><i class="fas fa-edit text-primary"></i></button><button class="btn btn-sm btn-light py-1 px-2" onclick="handleDeleteCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')" title="حذف"><i class="fas fa-trash text-danger"></i></button></div></li>`).join('');
    } else { list.innerHTML = '<li class="list-group-item text-muted text-center">لا توجد تصنيفات.</li>'; }
}

function renderCoursesList() {
    const list = document.getElementById('coursesList');
    if (!list) return;
    if (allCoursesCache.length > 0) { list.innerHTML = allCoursesCache.map(c => `<li class="list-group-item d-flex justify-content-between align-items-center"><div><span class="fw-bold">${c.name}</span><small class="d-block text-muted">${c.course_categories ? c.course_categories.name : 'بدون تصنيف'}</small></div><div><button class="btn btn-sm btn-light py-1 px-2" onclick="openEditCourseModal('${c.id}')" title="تعديل"><i class="fas fa-edit text-primary"></i></button><button class="btn btn-sm btn-light py-1 px-2" onclick="handleDeleteCourse('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="حذف"><i class="fas fa-trash text-danger"></i></button></div></li>`).join('');
    } else { list.innerHTML = '<li class="list-group-item text-muted text-center">لا توجد كورسات.</li>'; }
}

function populateCategorySelect(selectId, selectedId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>اختر تصنيف...</option>';
    allCategoriesCache.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        if (cat.id === selectedId) { option.selected = true; }
        select.appendChild(option);
    });
}

async function handleAddCategory(event) {
    event.preventDefault();
    const form = event.target;
    const categoryName = new FormData(form).get('name').trim();
    if (!categoryName) return;
    const { error } = await supabaseClient.from('course_categories').insert([{ name: categoryName }]);
    if (error) { Swal.fire('خطأ!', `لم تتم الإضافة: ${error.message}`, 'error');
    } else { Swal.fire('تم!', 'تمت إضافة التصنيف بنجاح.', 'success'); form.reset(); fetchSummaryData(); }
}

async function handleEditCategory(id, currentName) {
    const { value: newName } = await Swal.fire({ title: 'تعديل اسم التصنيف', input: 'text', inputValue: currentName, showCancelButton: true, confirmButtonText: 'حفظ', cancelButtonText: 'إلغاء', inputValidator: (value) => !value && 'يجب إدخال اسم للتصنيف!' });
    if (newName && newName.trim() !== currentName) {
        const { error } = await supabaseClient.from('course_categories').update({ name: newName.trim() }).eq('id', id);
        if (error) { Swal.fire('خطأ!', `لم يتم التحديث: ${error.message}`, 'error');
        } else { Swal.fire('تم!', 'تم تحديث التصنيف بنجاح.', 'success'); fetchSummaryData(); fetchSchedules(); }
    }
}

function handleDeleteCategory(id, name) { confirmDeletion(async () => {
    const { error } = await supabaseClient.from('course_categories').delete().eq('id', id);
    if (error) { Swal.fire('خطأ!', 'لم يتم الحذف. تأكد من عدم وجود كورسات مرتبطة بهذا التصنيف أولاً.', 'error');
    } else { Swal.fire('تم الحذف!', `تم حذف تصنيف ${name}.`, 'success'); fetchSummaryData(); }
}, `هل أنت متأكد من حذف تصنيف "${name}"؟`);}

async function handleAddCourse(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (!data.category_id) { Swal.fire('تنبيه', 'الرجاء اختيار تصنيف للكورس.', 'warning'); return; }
    const { error } = await supabaseClient.from('courses').insert([data]);
    if (error) { Swal.fire('خطأ!', `لم تتم الإضافة: ${error.message}`, 'error');
    } else { Swal.fire('تم!', 'تمت إضافة الكورس بنجاح.', 'success'); form.reset(); fetchSummaryData(); }
}

async function openEditCourseModal(courseId) {
    const course = allCoursesCache.find(c => c.id === courseId);
    if (!course) { Swal.fire('خطأ!', 'لم يتم العثور على بيانات الكورس.', 'error'); return; }
    const form = document.getElementById('courseEditForm');
    form.reset();
    form.querySelector('[name="id"]').value = course.id;
    form.querySelector('[name="name"]').value = course.name;
    form.querySelector('[name="price_per_student"]').value = course.price_per_student || 0;
    form.querySelector('[name="trainer_percentage"]').value = course.trainer_percentage || 0;
    populateCategorySelect('edit-course-category', course.category_id);
    courseEditModal.show();
}

async function handleCourseEditFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const courseData = Object.fromEntries(formData.entries());
    const courseId = courseData.id;
    delete courseData.id;
    courseData.price_per_student = parseFloat(courseData.price_per_student) || 0;
    courseData.trainer_percentage = parseInt(courseData.trainer_percentage) || 0;
    if (!courseData.name || !courseData.category_id) { Swal.fire('خطأ', 'يجب إدخال اسم واختيار تصنيف.', 'error'); return; }
    const { error } = await supabaseClient.from('courses').update(courseData).eq('id', courseId);
    if (error) { Swal.fire('خطأ!', `لم يتم التحديث: ${error.message}`, 'error');
    } else {
        await Swal.fire('تم!', 'تم تحديث الكورس بنجاح.', 'success');
        courseEditModal.hide();
        await fetchSummaryData();
        await fetchSchedules();
        if (currentScheduleCourse) { selectCourseForSchedule(currentScheduleCourse.id); }
    }
}

function handleDeleteCourse(id, name) { confirmDeletion(async () => {
    const { error } = await supabaseClient.from('courses').delete().eq('id', id);
    if (error) { Swal.fire('خطأ!', 'لم يتم الحذف، قد يكون الكورس مرتبطاً بجدول أو بطلاب.', 'error');
    } else { Swal.fire('تم الحذف!', `تم حذف كورس ${name}.`, 'success'); fetchSummaryData(); }
}, `هل أنت متأكد من حذف كورس "${name}"؟`);}

async function editCourseFromScheduleModal() { if (!currentScheduleCourse) return; openEditCourseModal(currentScheduleCourse.id); }

function renderScheduleCourseSearchResults(searchTerm) {
    const resultsContainer = document.getElementById('schedule-course-search-results');
    if(!searchTerm) { resultsContainer.classList.add('d-none'); return; }
    const filtered = allCoursesCache.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(filtered.length > 0) {
        resultsContainer.innerHTML = `<ul class="list-group">${filtered.map(item => `<li class="list-group-item" onclick="selectCourseForSchedule('${item.id}')">${item.name} <small class="text-muted d-block">${item.course_categories ? item.course_categories.name : 'N/A'}</small></li>`).join('')}</ul>`;
        resultsContainer.classList.remove('d-none');
    } else { resultsContainer.classList.add('d-none'); }
}

function selectCourseForSchedule(id) {
    const course = allCoursesCache.find(c => c.id === id);
    if (!course) return;
    currentScheduleCourse = course;
    document.querySelector('#scheduleForm [name="course_id"]').value = course.id;
    const displayContainer = document.getElementById('selected-schedule-course-display');
    const categoryName = course.course_categories ? course.course_categories.name : 'بدون تصنيف';
    displayContainer.innerHTML = `<div class="d-flex align-items-center p-2 rounded" style="background-color: var(--light-primary);"><div class="flex-grow-1"><span class="fw-bold text-primary">${course.name}</span><small class="d-block text-muted">${categoryName}</small></div><button type="button" class="btn btn-sm btn-light py-0 px-2 ms-2" onclick="editCourseFromScheduleModal()" title="تعديل بيانات الكورس"><i class="fas fa-edit text-primary"></i></button></div>`;
    document.getElementById('schedule-course-search-input').value = '';
    document.getElementById('schedule-course-search-results').classList.add('d-none');
    scheduleSelectedTrainees.clear(); 
    if (id) {
        supabaseClient.from('trainee_enrollments').select('trainees(id, full_name)').eq('course_id', id)
        .then(({ data: enrollments, error }) => {
            if (error) console.error("Error fetching enrollments for selected course", error);
            else if (enrollments) { enrollments.forEach(e => { if (e.trainees) scheduleSelectedTrainees.set(e.trainees.id, e.trainees.full_name); }); }
            renderScheduleSelectedTrainees();
        });
    } else { renderScheduleSelectedTrainees(); }
}

async function cacheAllTrainees() { const { data, error } = await supabaseClient.from('trainees').select('id, full_name'); if (error) console.error("Could not cache trainees", error); else allTraineesCache = data || []; }
async function cacheAllTrainers() { const { data, error } = await supabaseClient.from('trainers').select('id, full_name'); if (error) console.error("Could not cache trainers", error); else allTrainersCache = data || []; }

function renderScheduleTraineeSearchResults(searchTerm = '') {
    const resultsContainer = document.getElementById('schedule-trainee-search-results');
    if(!searchTerm) { resultsContainer.classList.add('d-none'); return; }
    const availableTrainees = allTraineesCache.filter(trainee => !scheduleSelectedTrainees.has(trainee.id));
    const filtered = availableTrainees.filter(t => t.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(filtered.length > 0) {
        resultsContainer.innerHTML = `<ul class="list-group">${filtered.map(t => `<li class="list-group-item" onclick="selectTraineeForSchedule('${t.id}', '${t.full_name.replace(/'/g, "\\'")}')">${t.full_name}</li>`).join('')}</ul>`;
        resultsContainer.classList.remove('d-none');
    } else { resultsContainer.classList.add('d-none'); }
}

function selectTraineeForSchedule(id, name) { scheduleSelectedTrainees.set(id, name); document.getElementById('schedule-trainee-search-input').value = ''; document.getElementById('schedule-trainee-search-results').classList.add('d-none'); renderScheduleSelectedTrainees(); }
function removeTraineeFromSchedule(id) { scheduleSelectedTrainees.delete(id); renderScheduleSelectedTrainees(); }

function renderScheduleSelectedTrainees() {
    const listContainer = document.getElementById('schedule-selected-trainees-list');
    if (scheduleSelectedTrainees.size === 0) { listContainer.innerHTML = '<p class="text-muted small m-0">لم يتم اختيار طلاب بعد. استخدم البحث أعلاه للإضافة.</p>'; return; }
    listContainer.innerHTML = '';
    for (const [id, name] of scheduleSelectedTrainees.entries()) { listContainer.innerHTML += `<div class="selected-tag" data-id="${id}">${name}<button type="button" onclick="removeTraineeFromSchedule('${id}')">&times;</button></div>`; }
}

function renderScheduleTrainerSearchResults(searchTerm) {
    const resultsContainer = document.getElementById('schedule-trainer-search-results');
    if(!searchTerm) { resultsContainer.classList.add('d-none'); return; }
    const filtered = allTrainersCache.filter(item => item.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(filtered.length > 0) {
        resultsContainer.innerHTML = `<ul class="list-group">${filtered.map(item => `<li class="list-group-item" onclick="selectTrainerForSchedule('${item.id}', '${item.full_name.replace(/'/g, "\\'")}')">${item.full_name}</li>`).join('')}</ul>`;
        resultsContainer.classList.remove('d-none');
    } else { resultsContainer.classList.add('d-none'); }
}

function selectTrainerForSchedule(id, name) { document.querySelector('#scheduleForm [name="trainer_id"]').value = id; document.getElementById('selected-schedule-trainer-display').innerHTML = `<span class="badge bg-primary">${name}</span>`; document.getElementById('schedule-trainer-search-input').value = ''; document.getElementById('schedule-trainer-search-results').classList.add('d-none'); }

// =================================================================================
//  Calendar Management
// =================================================================================
async function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    document.getElementById('month-year-display').textContent = `${calendarDate.toLocaleString('ar-EG', { month: 'long' })} ${year}`;
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].forEach(day => { grid.innerHTML += `<div class="calendar-day-header">${day}</div>`; });
    for (let i = 0; i < firstDayOfMonth; i++) { grid.innerHTML += `<div class="calendar-day not-in-month"></div>`; }
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) { dayCell.classList.add('today'); }
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dayCell.dataset.date = dateString;
        dayCell.innerHTML = `<span class="day-number">${i}</span><div class="events-container"></div>`;
        dayCell.addEventListener('click', () => openAppointmentModal(dateString));
        grid.appendChild(dayCell);
    }
    await fetchAndDisplayCalendarEvents(year, month);
}

async function fetchAndDisplayCalendarEvents(year, month) {
    const monthStr = String(month + 1).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${new Date(year, month + 1, 0).getDate()}`;
    const { data: schedules, error: scheduleError } = await supabaseClient.from('schedules').select('start_date, end_date, courses(name)').gte('start_date', startDate).lte('start_date', endDate);
    const { data: appointments, error: appointmentError } = await supabaseClient.from('appointments').select('title, appointment_date').gte('appointment_date', startDate).lte('appointment_date', endDate);
    if (scheduleError) console.error("Error fetching schedules for calendar", scheduleError);
    if (appointmentError) console.error("Error fetching appointments for calendar", appointmentError);
    if (schedules) { schedules.forEach(event => { if (event.courses) { const dayCell = document.querySelector(`.calendar-day[data-date="${event.start_date}"]`); if (dayCell) { dayCell.querySelector('.events-container').innerHTML += `<div class="event-dot course">${event.courses.name}</div>`; } } }); }
    if (appointments) { appointments.forEach(event => { const dayCell = document.querySelector(`.calendar-day[data-date="${event.appointment_date}"]`); if (dayCell) { dayCell.querySelector('.events-container').innerHTML += `<div class="event-dot appointment">${event.title}</div>`; } }); }
}

async function openAppointmentModal(dateString) {
    hideAllTooltips();
    const form = document.getElementById('appointmentForm');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    form.querySelector('[name="appointment_date"]').value = dateString;
    document.getElementById('appointment-form-section-title').textContent = 'إضافة موعد جديد';
    document.getElementById('appointmentModalTitle').textContent = `مواعيد يوم ${dateString}`;
    const listContainer = document.getElementById('day-appointments-list');
    listContainer.innerHTML = 'جاري تحميل المواعيد...';
    const { data: appointments, error } = await supabaseClient.from('appointments').select('*').eq('appointment_date', dateString).order('created_at');
    if (error) { listContainer.innerHTML = '<div class="alert alert-danger">خطأ في جلب المواعيد.</div>';
    } else if (appointments.length === 0) { listContainer.innerHTML = '<p class="text-muted">لا توجد مواعيد خاصة لهذا اليوم.</p>';
    } else { listContainer.innerHTML = `<h6 class="form-section-title">المواعيد المسجلة:</h6><ul class="list-group list-group-flush">${appointments.map(apt => `<li class="list-group-item d-flex justify-content-between align-items-center px-0"><div><strong>${apt.title}</strong><p class="mb-0 small text-muted">${apt.description || ''}</p></div><div><button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="editAppointment('${apt.id}')"><i class="fas fa-edit"></i></button><button type="button" class="btn btn-sm btn-outline-danger" onclick="handleDeleteAppointment('${apt.id}', '${dateString}')"><i class="fas fa-trash"></i></button></div></li>`).join('')}</ul>`; }
    appointmentModal.show();
}

async function editAppointment(id) {
    const { data, error } = await supabaseClient.from('appointments').select('*').eq('id', id).single();
    if (error || !data) { Swal.fire('خطأ!', 'لم يتم العثور على الموعد.', 'error'); return; }
    const form = document.getElementById('appointmentForm');
    form.querySelector('[name="id"]').value = data.id;
    form.querySelector('[name="title"]').value = data.title;
    form.querySelector('[name="appointment_date"]').value = data.appointment_date;
    form.querySelector('[name="description"]').value = data.description;
    document.getElementById('appointment-form-section-title').textContent = 'تعديل الموعد';
}

function handleDeleteAppointment(id, dateString) { confirmDeletion(async () => {
    const { error } = await supabaseClient.from('appointments').delete().eq('id', id);
    if (error) { Swal.fire('خطأ!', 'لم يتم حذف الموعد.', 'error');
    } else { Swal.fire('تم!', 'تم الحذف بنجاح.', 'success'); openAppointmentModal(dateString); renderCalendar(); }
}, 'هل أنت متأكد من حذف هذا الموعد؟');}

async function handleAppointmentFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    let appointmentData = Object.fromEntries(formData.entries());
    const id = appointmentData.id;
    const dateString = appointmentData.appointment_date;
    delete appointmentData.id;
    const sanitizedData = sanitizeData(appointmentData);
    const { error } = id ? await supabaseClient.from('appointments').update(sanitizedData).eq('id', id) : await supabaseClient.from('appointments').insert([sanitizedData]);
    if (error) { console.error('Error saving appointment:', error); Swal.fire('خطأ!', 'لم يتم حفظ الموعد.', 'error');
    } else { Swal.fire('تم!', 'تم حفظ الموعد بنجاح.', 'success'); form.reset(); form.querySelector('[name="id"]').value = ''; document.getElementById('appointment-form-section-title').textContent = 'إضافة موعد جديد'; openAppointmentModal(dateString); renderCalendar(); }
}

// =================================================================================
//  Attendance Management
// =================================================================================
async function fetchCoursesForAttendance() {
    showLoader('attendance-course-list');
    const { data, error } = await supabaseClient.from('schedules').select('id, start_date, end_date, courses(id, name)').order('start_date', { ascending: false });
    if (error) { console.error('Error fetching courses for attendance:', error); document.getElementById('attendance-course-list').innerHTML = '<div class="alert alert-danger">خطأ في جلب الكورسات.</div>';
    } else { displayCoursesForAttendance(data); }
}

function displayCoursesForAttendance(schedules) {
    const container = document.getElementById('attendance-course-list');
    if (!schedules || schedules.length === 0) { container.innerHTML = '<div class="alert alert-info">لا توجد كورسات مجدولة لعرض تقارير التفقد.</div>'; return; }
    container.innerHTML = schedules.map(schedule => {
        if (!schedule.courses) return '';
        const safeCourseName = schedule.courses.name.replace(/'/g, "\\'");
        return `<div class="col-md-6 col-lg-4 mb-4"><div class="result-card clickable h-100" onclick="openAttendanceReportModal('${schedule.id}', '${safeCourseName}')"><h5><i class="fas fa-book-reader me-2"></i>${schedule.courses.name}</h5><p class="mb-0 text-muted small"><i class="far fa-clock me-2"></i>${schedule.start_date} إلى ${schedule.end_date}</p></div></div>`;
    }).join('');
}

async function openAttendanceModal(scheduleId, courseName) {
    hideAllTooltips();
    const form = document.getElementById('attendanceForm');
    form.reset();
    form.querySelector('[name="schedule_id"]').value = scheduleId;
    document.getElementById('attendanceModalTitle').textContent = `تفقد كورس: ${courseName}`;
    const today = getTodayDateString();
    document.getElementById('attendance_date').value = today;
    await loadAttendanceForDate(scheduleId, today);
    attendanceModal.show();
}

async function loadAttendanceForDate(scheduleId, date) {
    const studentListDiv = document.getElementById('attendance-student-list');
    studentListDiv.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';
    const { data: scheduleData } = await supabaseClient.from('schedules').select('courses(id)').eq('id', scheduleId).single();
    if (!scheduleData || !scheduleData.courses) { studentListDiv.innerHTML = 'خطأ: لم يتم العثور على الكورس.'; return; }
    const { data: enrollments } = await supabaseClient.from('trainee_enrollments').select('trainees(*)').eq('course_id', scheduleData.courses.id);
    if (!enrollments) { studentListDiv.innerHTML = 'خطأ في جلب الطلاب.'; return; }
    const { data: attendanceRecords } = await supabaseClient.from('attendance').select('*').eq('schedule_id', scheduleId).eq('attendance_date', date);
    if (enrollments.length === 0) { studentListDiv.innerHTML = '<div class="alert alert-info">لا يوجد طلاب مسجلين في هذا الكورس.</div>'; return; }
    studentListDiv.innerHTML = enrollments.map(enrollment => {
        const trainee = enrollment.trainees;
        if (!trainee) return '';
        const record = attendanceRecords ? attendanceRecords.find(r => r.trainee_id === trainee.id) : null;
        const status = record ? record.status : 'حاضر';
        return `<div class="d-flex justify-content-between align-items-center border-bottom py-2"><span>${trainee.full_name}</span><div class="btn-group" role="group"><input type="radio" class="btn-check" name="attendance-${trainee.id}" id="present-${trainee.id}" value="حاضر" ${status === 'حاضر' ? 'checked' : ''}><label class="btn btn-outline-success btn-sm" for="present-${trainee.id}">حاضر</label><input type="radio" class="btn-check" name="attendance-${trainee.id}" id="absent-${trainee.id}" value="غائب" ${status === 'غائب' ? 'checked' : ''}><label class="btn btn-outline-danger btn-sm" for="absent-${trainee.id}">غائب</label><input type="radio" class="btn-check" name="attendance-${trainee.id}" id="late-${trainee.id}" value="متأخر" ${status === 'متأخر' ? 'checked' : ''}><label class="btn btn-outline-warning btn-sm" for="late-${trainee.id}">متأخر</label></div></div>`;
    }).join('');
}


async function openAttendanceReportModal(scheduleId, courseName) {
    const modalElement = document.getElementById('attendanceReportModal');
    modalElement.dataset.scheduleId = scheduleId;
    modalElement.dataset.courseName = courseName;
    document.getElementById('attendanceReportModalTitle').textContent = `تقرير تفقد: ${courseName}`;
    const body = document.getElementById('attendanceReportModalBody');
    showLoader('attendanceReportModalBody');
    attendanceReportModal.show();
    const { data: enrollments, error: enrollError } = await supabaseClient.from('schedules').select('courses(trainee_enrollments(trainees(id, full_name)))').eq('id', scheduleId).single();
    if (enrollError || !enrollments || !enrollments.courses) { body.innerHTML = '<div class="alert alert-danger">خطأ في جلب قائمة الطلاب.</div>'; return; }
    const students = enrollments.courses.trainee_enrollments.map(e => e.trainees).filter(Boolean);
    const { data: attendanceRecords, error: attendanceError } = await supabaseClient.from('attendance').select('trainee_id, attendance_date, status').eq('schedule_id', scheduleId);
    if (attendanceError) { body.innerHTML = '<div class="alert alert-danger">خطأ في جلب سجلات التفقد.</div>'; return; }
    const reportData = { students: {}, dates: new Set() };
    students.forEach(student => { reportData.students[student.id] = { name: student.full_name, attendance: {} }; });
    attendanceRecords.forEach(record => {
        reportData.dates.add(record.attendance_date);
        if (reportData.students[record.trainee_id]) {
            reportData.students[record.trainee_id].attendance[record.attendance_date] = record.status;
        }
    });
    const sortedDates = Array.from(reportData.dates).sort();
    body.innerHTML = generateAttendanceReportHTML(reportData, sortedDates, scheduleId);
    initializeTooltips();
    const saveBtn = document.getElementById('saveAttendanceReportBtn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.addEventListener('click', () => handleSaveAttendanceReport(scheduleId));
}

function getStatusInfo(status) {
    switch (status) {
        case 'حاضر': return { text: 'حاضر', className: 'status-present' };
        case 'متأخر': return { text: 'متأخر', className: 'status-late' };
        default: return { text: 'غائب', className: 'status-absent' };
    }
}

function cycleAttendanceStatus(element) {
    const currentStatus = element.dataset.status;
    let nextStatus = 'حاضر';
    if (currentStatus === 'حاضر') nextStatus = 'متأخر';
    else if (currentStatus === 'متأخر') nextStatus = 'غائب';
    const statusInfo = getStatusInfo(nextStatus);
    element.dataset.status = nextStatus;
    element.textContent = statusInfo.text;
    element.className = `attendance-status-badge ${statusInfo.className}`;
}

function generateAttendanceReportHTML(reportData, dates, scheduleId) {
    if (Object.keys(reportData.students).length === 0) { return '<div class="alert alert-info">لا يوجد طلاب مسجلون في هذا الكورس.</div>'; }
    let tableHTML = `<div class="table-responsive"><table class="table table-bordered table-striped attendance-report-table"><thead><tr><th class="student-name">اسم الطالب</th>${dates.map(date => `<th><div class="attendance-header-date"><span>${date}</span><button class="btn btn-outline-danger delete-date-btn" onclick="confirmDeleteAttendanceDate('${scheduleId}', '${date}')" title="حذف هذا اليوم" data-bs-toggle="tooltip" data-bs-placement="top"><i class="fas fa-trash-alt"></i></button></div></th>`).join('')}</tr></thead><tbody>`;
    for (const studentId in reportData.students) {
        const student = reportData.students[studentId];
        tableHTML += `<tr><td class="student-name">${student.name}</td>`;
        dates.forEach(date => {
            const status = student.attendance[date] || 'غائب';
            const statusInfo = getStatusInfo(status);
            tableHTML += `<td><span class="attendance-status-badge ${statusInfo.className}" data-trainee-id="${studentId}" data-date="${date}" data-status="${status}" onclick="cycleAttendanceStatus(this)">${statusInfo.text}</span></td>`;
        });
        tableHTML += `</tr>`;
    }
    tableHTML += `</tbody></table></div>`;
    return tableHTML;
}

function confirmDeleteAttendanceDate(scheduleId, date) { confirmDeletion(() => handleDeleteAttendanceDate(scheduleId, date), `هل أنت متأكد من حذف جميع سجلات التفقد ليوم ${date}؟ لا يمكن التراجع عن هذا الإجراء.`);}

async function handleDeleteAttendanceDate(scheduleId, date) {
    const { error } = await supabaseClient.from('attendance').delete().eq('schedule_id', scheduleId).eq('attendance_date', date);
    if (error) { console.error("Error deleting attendance date:", error); Swal.fire('خطأ!', 'لم يتم حذف سجلات التفقد لهذا اليوم.', 'error');
    } else { Swal.fire('تم الحذف!', `تم حذف جميع سجلات يوم ${date} بنجاح.`, 'success'); const modalElement = document.getElementById('attendanceReportModal'); openAttendanceReportModal(scheduleId, modalElement.dataset.courseName); }
}

async function handleSaveAttendanceReport(scheduleId) {
    const badges = document.querySelectorAll('#attendanceReportModalBody .attendance-status-badge');
    const recordsToUpsert = Array.from(badges).map(badge => ({ schedule_id: scheduleId, trainee_id: badge.dataset.traineeId, attendance_date: badge.dataset.date, status: badge.dataset.status }));
    if (recordsToUpsert.length > 0) {
        const { error } = await supabaseClient.from('attendance').upsert(recordsToUpsert, { onConflict: 'schedule_id,trainee_id,attendance_date' });
        if (error) { console.error('Error saving attendance report:', error); Swal.fire('خطأ!', 'لم يتم حفظ التعديلات.', 'error');
        } else { Swal.fire('تم!', 'تم حفظ التعديلات بنجاح.', 'success'); attendanceReportModal.hide(); }
    } else { attendanceReportModal.hide(); }
}


async function handleAttendanceFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const schedule_id = formData.get('schedule_id');
    const attendance_date = formData.get('attendance_date');
    
    const records = [];
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('attendance-')) {
            const trainee_id = key.substring('attendance-'.length);
            records.push({ schedule_id, trainee_id, attendance_date, status: value });
        }
    }

    const { error } = await supabaseClient.from('attendance').upsert(records, { onConflict: 'schedule_id,trainee_id,attendance_date' });
    if (error) { console.error('Error saving attendance:', error); Swal.fire('خطأ!', 'لم يتم حفظ التفقد.', 'error'); } 
    else { Swal.fire('تم!', 'تم حفظ التفقد بنجاح.', 'success'); attendanceModal.hide(); }
}


// =================================================================================
//  Inventory Management
// =================================================================================
async function fetchInventoryData(searchTerm = '') {
    showLoader('inventory-results');
    
    let itemsQuery = supabaseClient.from('inventory_items').select('id, name');
    if(searchTerm) {
        itemsQuery = itemsQuery.ilike('name', `%${searchTerm}%`);
    }
    const { data: items, error: itemsError } = await itemsQuery.order('name');

    if (itemsError) {
        console.error("Error fetching inventory items", itemsError);
        return;
    }

    const { data: transactions, error: transError } = await supabaseClient.from('inventory_transactions').select('*');
    if (transError) {
        console.error("Error fetching inventory transactions", transError);
        return;
    }

    const inventoryData = items.map(item => {
        const itemTransactions = transactions.filter(t => t.item_id === item.id);
        const totalIn = itemTransactions.filter(t => t.transaction_type === 'in').reduce((sum, t) => sum + t.quantity, 0);
        const totalOut = itemTransactions.filter(t => t.transaction_type === 'out').reduce((sum, t) => sum + t.quantity, 0);
        const balance = totalIn - totalOut;
        return { ...item, totalIn, totalOut, balance };
    });

    displayInventory(inventoryData);
}

function getBalanceClass(balance) {
    if (balance <= 0) return 'balance-danger';
    if (balance <= 10) return 'balance-low';
    return 'balance-ok';
}

function displayInventory(inventoryData) {
    const container = document.getElementById('inventory-results');
    if (inventoryData.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد أصناف في المخزون. أضف صنفاً جديداً للبدء.</div>';
        return;
    }

    container.innerHTML = `
        <table class="table table-bordered table-hover align-middle inventory-table">
            <thead class="table-light">
                <tr>
                    <th>الصنف</th>
                    <th>إجمالي الداخل</th>
                    <th>إجمالي الخارج</th>
                    <th>الرصيد الحالي</th>
                    <th class="actions-cell text-start">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${inventoryData.map(item => `
                    <tr id="item-row-${item.id}">
                        <td class="item-name-cell">
                            <span id="item-name-${item.id}">${item.name}</span>
                            <input type="text" class="form-control d-none" id="item-input-${item.id}" value="${item.name}">
                        </td>
                        <td>${item.totalIn}</td>
                        <td>${item.totalOut}</td>
                        <td class="fw-bold ${getBalanceClass(item.balance)}">${item.balance}</td>
                        <td class="actions-cell text-start" onclick="event.stopPropagation();">
                            <div id="actions-view-${item.id}" class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="openInventoryDetailModal('${item.id}', '${item.name.replace(/'/g, "\\'")}')" title="عرض التفاصيل" data-bs-toggle="tooltip" data-bs-placement="top"><i class="fas fa-list-ul text-info"></i></button>
                                <button class="btn btn-sm btn-light" onclick="toggleItemEditMode('${item.id}', true)" title="تعديل الاسم" data-bs-toggle="tooltip" data-bs-placement="top"><i class="fas fa-edit text-primary"></i></button>
                                <button class="btn btn-sm btn-light" onclick="handleDeleteInventoryItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')" title="حذف الصنف" data-bs-toggle="tooltip" data-bs-placement="top"><i class="fas fa-trash text-danger"></i></button>
                            </div>
                            <div id="actions-edit-${item.id}" class="d-none btn-group">
                                <button class="btn btn-sm btn-light" onclick="handleUpdateInventoryItem('${item.id}')" title="حفظ"><i class="fas fa-check text-success"></i></button>
                                <button class="btn btn-sm btn-light" onclick="toggleItemEditMode('${item.id}', false)" title="إلغاء"><i class="fas fa-times text-secondary"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    initializeTooltips();
}

function toggleItemEditMode(itemId, isEditing) {
    hideAllTooltips();
    document.getElementById(`item-name-${itemId}`).classList.toggle('d-none', isEditing);
    document.getElementById(`item-input-${itemId}`).classList.toggle('d-none', !isEditing);
    document.getElementById(`actions-view-${itemId}`).classList.toggle('d-none', isEditing);
    document.getElementById(`actions-edit-${itemId}`).classList.toggle('d-none', !isEditing);
    if (isEditing) {
        document.getElementById(`item-input-${itemId}`).focus();
    }
}

async function handleUpdateInventoryItem(itemId) {
    const newName = document.getElementById(`item-input-${itemId}`).value.trim();
    if (!newName) {
        Swal.fire('تنبيه!', 'اسم الصنف لا يمكن أن يكون فارغاً.', 'warning');
        return;
    }
    const { error } = await supabaseClient.from('inventory_items').update({ name: newName }).eq('id', itemId);
    if (error) {
        console.error("Error updating item:", error);
        Swal.fire('خطأ!', 'لم يتم تحديث الصنف.', 'error');
    } else {
        fetchInventoryData(); // Refresh the table
    }
}

function handleDeleteInventoryItem(id, name) {
    confirmDeletion(async () => {
        const { error } = await supabaseClient.from('inventory_items').delete().eq('id', id);
        if (error) {
            Swal.fire('خطأ!', 'لم يتم حذف الصنف.', 'error');
        } else {
            Swal.fire('تم!', 'تم حذف الصنف وجميع حركاته بنجاح.', 'success');
            fetchInventoryData();
        }
    }, `هل أنت متأكد من حذف صنف "${name}"؟ سيتم حذف جميع الحركات المرتبطة به أيضاً.`);
}

async function openInventoryItemModal() {
    hideAllTooltips();
    const { value: itemName } = await Swal.fire({
        title: 'إضافة صنف جديد',
        input: 'text',
        inputLabel: 'اسم الصنف',
        inputPlaceholder: 'أدخل اسم الصنف هنا...',
        showCancelButton: true,
        confirmButtonText: 'إضافة',
        cancelButtonText: 'إلغاء',
        inputValidator: (value) => {
            if (!value) {
                return 'يجب إدخال اسم الصنف!'
            }
        }
    });

    if (itemName) {
        const { error } = await supabaseClient.from('inventory_items').insert([{ name: itemName }]);
        if (error) {
            console.error("Error adding inventory item:", error);
            Swal.fire('خطأ!', 'حدث خطأ أثناء إضافة الصنف. قد يكون الاسم مكرراً.', 'error');
        } else {
            Swal.fire('تم!', 'تمت إضافة الصنف بنجاح.', 'success');
            await cacheInventoryItems();
            fetchInventoryData();
        }
    }
}

async function cacheInventoryItems() {
    const { data, error } = await supabaseClient.from('inventory_items').select('id, name').order('name');
    if (error) console.error("Error caching inventory items", error);
    else allInventoryItemsCache = data || [];
}

async function openTransactionModal(transactionId = null) {
    hideAllTooltips();
    const form = document.getElementById('inventoryTransactionForm');
    form.reset();
    const modalTitle = document.getElementById('inventoryTransactionModalTitle');
    
    form.querySelector('[name="item_id"]').value = '';
    document.getElementById('selected-inventory-item-display').innerHTML = '';
    document.getElementById('inventory-item-search-input').value = '';

    if (allInventoryItemsCache.length === 0) {
        await cacheInventoryItems();
    }

    if (transactionId) {
        modalTitle.textContent = 'تعديل حركة مخزون';
        const { data, error } = await supabaseClient.from('inventory_transactions').select('*, inventory_items(name)').eq('id', transactionId).single();
        if (error || !data) {
            Swal.fire('خطأ!', 'لم يتم العثور على الحركة.', 'error');
            return;
        }
        form.querySelector('[name="id"]').value = data.id;
        selectInventoryItem(data.item_id, data.inventory_items.name);
        form.querySelector('[name="transaction_type"]').value = data.transaction_type;
        form.querySelector('[name="quantity"]').value = data.quantity;
        form.querySelector('[name="unit"]').value = data.unit || 'عدد'; // SET UNIT VALUE
        form.querySelector('[name="transaction_date"]').value = data.transaction_date;
        form.querySelector('[name="description"]').value = data.description;
    } else {
        modalTitle.textContent = 'إضافة حركة مخزون';
        form.querySelector('[name="id"]').value = '';
        form.querySelector('[name="transaction_date"]').value = getTodayDateString();
    }
    
    if(inventoryDetailModal && inventoryDetailModal._isShown) inventoryDetailModal.hide();
    setTimeout(() => inventoryTransactionModal.show(), 200);
}

async function openInventoryDetailModal(itemId, itemName) {
    hideAllTooltips();
    lastOpenedDetail = { itemId, itemName };
    document.getElementById('inventoryDetailModalTitle').textContent = `تفاصيل حركات: ${itemName}`;
    const body = document.getElementById('inventoryDetailModalBody');
    showLoader('inventoryDetailModalBody');
    inventoryDetailModal.show();

    const { data, error } = await supabaseClient
        .from('inventory_transactions')
        .select('*')
        .eq('item_id', itemId)
        .order('transaction_date', { ascending: false });

    if (error) {
        body.innerHTML = '<div class="alert alert-danger">خطأ في جلب الحركات.</div>';
        return;
    }

    if (data.length === 0) {
        body.innerHTML = '<div class="alert alert-info">لا توجد حركات مسجلة لهذا الصنف.</div>';
        return;
    }

    body.innerHTML = `
        <table class="table table-bordered table-hover align-middle">
            <thead class="table-light">
                <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th>البيان</th>
                    <th class="text-end">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(t => `
                    <tr>
                        <td>${t.transaction_date}</td>
                        <td>${t.transaction_type === 'in' ? '<span class="badge bg-success-subtle text-success-emphasis border border-success-subtle">داخل</span>' : '<span class="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">خارج</span>'}</td>
                        <td class="fw-bold">${t.quantity} ${t.unit || ''}</td>
                        <td class="text-muted">${t.description || '-'}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-light" onclick="openTransactionModal('${t.id}')" title="تعديل"><i class="fas fa-edit text-primary"></i></button>
                            <button class="btn btn-sm btn-light" onclick="handleDeleteInventoryTransaction('${t.id}', '${itemId}', '${itemName.replace(/'/g, "\\'")}')" title="حذف"><i class="fas fa-trash text-danger"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    initializeTooltips();
}

function handleDeleteInventoryTransaction(transactionId, itemId, itemName) {
    confirmDeletion(async () => {
        const { error } = await supabaseClient.from('inventory_transactions').delete().eq('id', transactionId);
        if (error) {
            Swal.fire('خطأ!', 'لم يتم حذف الحركة.', 'error');
        } else {
            Swal.fire('تم!', 'تم حذف الحركة بنجاح.', 'success');
            openInventoryDetailModal(itemId, itemName);
            fetchInventoryData();
        }
    }, 'هل أنت متأكد من حذف هذه الحركة؟ هذا الإجراء لا يمكن التراجع عنه.');
}

async function handleInventoryTransactionSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const transactionData = Object.fromEntries(formData.entries());
    const id = transactionData.id;

    if (!transactionData.item_id) {
        Swal.fire('تنبيه!', 'الرجاء اختيار صنف.', 'warning');
        return;
    }

    const dataToSubmit = { ...transactionData };
    delete dataToSubmit.id;
    
    const { error } = id
        ? await supabaseClient.from('inventory_transactions').update(dataToSubmit).eq('id', id)
        : await supabaseClient.from('inventory_transactions').insert([dataToSubmit]);

    if (error) {
        console.error("Error saving transaction:", error);
        Swal.fire('خطأ!', 'لم يتم حفظ الحركة.', 'error');
    } else {
        Swal.fire('تم!', 'تم حفظ الحركة بنجاح.', 'success');
        document.getElementById('inventoryTransactionModal')._transactionWasSaved = true;
        inventoryTransactionModal.hide();
        fetchInventoryData();
    }
}

function renderInventoryItemSearchResults(searchTerm) {
    const resultsContainer = document.getElementById('inventory-item-search-results');
    if(!searchTerm) {
        resultsContainer.classList.add('d-none');
        return;
    }
    const filtered = allInventoryItemsCache.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if(filtered.length > 0) {
        resultsContainer.innerHTML = `<ul class="list-group">${filtered.map(item => `<li class="list-group-item" onclick="selectInventoryItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">${item.name}</li>`).join('')}</ul>`;
        resultsContainer.classList.remove('d-none');
    } else {
        resultsContainer.classList.add('d-none');
    }
}

function selectInventoryItem(id, name) {
    document.querySelector('#inventoryTransactionForm [name="item_id"]').value = id;
    document.getElementById('selected-inventory-item-display').innerHTML = `<span class="badge bg-primary">${name}</span>`;
    document.getElementById('inventory-item-search-input').value = '';
    document.getElementById('inventory-item-search-results').classList.add('d-none');
}
// =================================================================================
//  App Initialization
// =================================================================================
function initializeApp() {
    // Initialize Modals
    traineeModal = new bootstrap.Modal(document.getElementById('traineeModal'));
    trainerModal = new bootstrap.Modal(document.getElementById('trainerModal'));
    scheduleModal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    attendanceModal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    inventoryTransactionModal = new bootstrap.Modal(document.getElementById('inventoryTransactionModal'));
    inventoryDetailModal = new bootstrap.Modal(document.getElementById('inventoryDetailModal'));
    courseDetailModal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
    attendanceReportModal = new bootstrap.Modal(document.getElementById('attendanceReportModal'));
    expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'));
    courseEditModal = new bootstrap.Modal(document.getElementById('courseEditModal'));

    // Fetch initial data for all tabs
    fetchSummaryData();
    fetchTrainees();
    fetchTrainers();
    fetchSchedules();
    fetchCoursesForAttendance();
    cacheAllTrainees();
    cacheAllTrainers();
    renderCalendar();
    fetchInventoryData();
    cacheInventoryItems();

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('trainee-search-btn').addEventListener('click', () => fetchTrainees(document.getElementById('trainee-search-input').value));
    document.getElementById('trainer-search-btn').addEventListener('click', () => fetchTrainers(document.getElementById('trainer-search-input').value));
    document.getElementById('schedule-search-btn').addEventListener('click', () => fetchSchedules(document.getElementById('schedule-search-input').value));
    document.getElementById('inventory-search-btn').addEventListener('click', () => fetchInventoryData(document.getElementById('inventory-search-input').value));
    document.getElementById('trainee-search-input').addEventListener('keyup', (e) => { if (e.key === 'Enter') e.target.nextElementSibling.click(); });
    document.getElementById('trainer-search-input').addEventListener('keyup', (e) => { if (e.key === 'Enter') e.target.nextElementSibling.click(); });
    document.getElementById('schedule-search-input').addEventListener('keyup', (e) => { if (e.key === 'Enter') e.target.nextElementSibling.click(); });
    document.getElementById('inventory-search-input').addEventListener('keyup', (e) => { if (e.key === 'Enter') e.target.nextElementSibling.click(); });
    document.getElementById('addTrainerBtn').addEventListener('click', () => openTrainerModal());
    document.getElementById('addTraineeBtn').addEventListener('click', () => openTraineeModal());
    document.getElementById('addScheduleBtn').addEventListener('click', () => openScheduleModal());
    document.getElementById('addInventoryItemBtn').addEventListener('click', openInventoryItemModal);
    document.getElementById('addInventoryTransactionBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('traineeForm').addEventListener('submit', handleTraineeFormSubmit);
    document.getElementById('trainerForm').addEventListener('submit', handleTrainerFormSubmit);
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleFormSubmit);
    document.getElementById('attendanceForm').addEventListener('submit', handleAttendanceFormSubmit);
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentFormSubmit);
    document.getElementById('inventoryTransactionForm').addEventListener('submit', handleInventoryTransactionSubmit);
    document.getElementById('courseEditForm').addEventListener('submit', handleCourseEditFormSubmit);
    document.getElementById('course-search-input').addEventListener('keyup', (e) => renderCourseSearchResults(e.target.value));
    document.getElementById('schedule-trainee-search-input').addEventListener('keyup', (e) => renderScheduleTraineeSearchResults(e.target.value));
    document.getElementById('inventory-item-search-input').addEventListener('keyup', (e) => renderInventoryItemSearchResults(e.target.value));
    document.getElementById('schedule-course-search-input').addEventListener('keyup', (e) => renderScheduleCourseSearchResults(e.target.value));
    document.getElementById('schedule-trainer-search-input').addEventListener('keyup', (e) => renderScheduleTrainerSearchResults(e.target.value));
    document.getElementById('courseStatus').addEventListener('change', function() { toggleScheduleFormLock(this.checked); });
    document.getElementById('prev-month-btn').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month-btn').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('attendance-tab').addEventListener('shown.bs.tab', fetchCoursesForAttendance);
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => { if (deleteFunction) deleteFunction(); confirmModal.hide(); });
    const transactionModalEl = document.getElementById('inventoryTransactionModal');
    transactionModalEl.addEventListener('hidden.bs.modal', () => {
        if (!transactionModalEl._transactionWasSaved && lastOpenedDetail.itemId) {
            inventoryDetailModal.show();
        }
        transactionModalEl._transactionWasSaved = false;
    });
}

document.addEventListener('DOMContentLoaded', checkUser);

