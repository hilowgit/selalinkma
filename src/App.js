import React, { useState, useEffect } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Supabase Client Setup ---
// The variables should be in a .env file in a real project
// For this environment, we'll define them here.
// PLEASE REPLACE with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co'; // ⚠️ استبدل هذا
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // ⚠️ استبدل هذا
// Create a single Supabase client for the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- Helper: Icon Components (Inline SVG for portability) ---
const UserIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const TeacherIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 11v-1a2 2 0 0 1 4 0v1"></path><path d="M12 12h-2a2 2 0 0 0 0 4h2"></path><path d="m14 14 2 2"></path></svg>;
const CalendarIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>;
const SearchIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg>;
const PlusCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>;
const ChevronLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;
const XIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// --- Custom Modal for confirmation ---
const ConfirmationModal = ({ show, onConfirm, onCancel, message }) => {
    if (!show) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"><div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center"><p className="text-white text-lg mb-6">{message}</p><div className="flex justify-center gap-4"><Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">إلغاء</Button><Button onClick={onConfirm} className="bg-red-600 hover:bg-red-500">تأكيد الحذف</Button></div></div></div>);
};

// --- Helper Components ---
const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={onClose}><div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="p-5 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10"><h3 className="text-xl font-bold text-white">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><XIcon className="w-6 h-6" /></button></div><div className="p-6">{children}</div></div></div>);
};
const Input = ({ label, ...props }) => (<div><label className="block text-sm font-medium text-gray-300 mb-1">{label}</label><input {...props} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" /></div>);
const Textarea = ({ label, ...props }) => (<div><label className="block text-sm font-medium text-gray-300 mb-1">{label}</label><textarea {...props} rows="3" className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" /></div>);
const Button = ({ children, onClick, className = '', type = 'button' }) => (<button type={type} onClick={onClick} className={`px-4 py-2 rounded-lg font-semibold text-white transition ${className}`}>{children}</button>);
const DetailItem = ({ label, value }) => (<div className="bg-gray-700 p-3 rounded-lg"><strong className="block text-blue-400 mb-1">{label}:</strong> {value || 'غير مسجل'}</div>);

// --- Trainees Section ---
const TraineeForm = ({ onSave, onCancel, trainee }) => {
    const [formData, setFormData] = useState({ fullName: '', nationalId: '', phoneNumber: '', address: '', dob: '', motherName: '', education: '' });
    useEffect(() => { if (trainee) setFormData(trainee); else setFormData({ fullName: '', nationalId: '', phoneNumber: '', address: '', dob: '', motherName: '', education: '' }) }, [trainee]);
    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSave = e => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="الاسم الثلاثي" name="fullName" value={formData.fullName} onChange={handleChange} required />
                <Input label="الرقم الوطني" name="nationalId" value={formData.nationalId} onChange={handleChange} />
                <Input label="رقم الهاتف" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                <Input label="السكن" name="address" value={formData.address} onChange={handleChange} />
                <Input label="تاريخ الميلاد" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                <Input label="اسم الأم" name="motherName" value={formData.motherName} onChange={handleChange} />
                <Input label="التحصيل العلمي" name="education" value={formData.education} onChange={handleChange} />
            </div>
            <div className="flex justify-end items-center gap-4 pt-4">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">إلغاء</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500">حفظ البيانات</Button>
            </div>
        </form>
    );
};
const TraineeDetails = ({ trainee, onEdit, onDelete }) => {
    if (!trainee) return null;
    return (<div className="bg-gray-800 p-6 rounded-xl space-y-4 animate-fade-in"><div className="flex justify-between items-start"><h3 className="text-2xl font-bold text-white">{trainee.fullName}</h3><div className="flex gap-2"><Button onClick={() => onEdit(trainee)} className="bg-blue-600 hover:bg-blue-500 text-sm !py-1 !px-3">تعديل</Button><Button onClick={() => onDelete(trainee.id)} className="bg-red-600 hover:bg-red-500 text-sm !py-1 !px-3"><TrashIcon className="w-4 h-4 inline-block ml-1"/>حذف</Button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm"><DetailItem label="الرقم الوطني" value={trainee.nationalId} /><DetailItem label="رقم الهاتف" value={trainee.phoneNumber} /><DetailItem label="السكن" value={trainee.address} /><DetailItem label="تاريخ الميلاد" value={trainee.dob} /><DetailItem label="اسم الأم" value={trainee.motherName} /><DetailItem label="التحصيل" value={trainee.education} /></div><div className="pt-4"><h4 className="font-bold text-lg text-blue-300 mb-2">معلومات إضافية</h4><div className="space-y-2 text-sm text-gray-300"><p>الكورسات المسجلة: لم يتم إضافة هذه الميزة بعد.</p><p>الدفعات المالية: لم يتم إضافة هذه الميزة بعد.</p><p>الشهادات: لم يتم إضافة هذه الميزة بعد.</p></div></div></div>);
};
const TraineesView = () => {
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

    const fetchTrainees = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('trainees').select('*').order('fullName');
        if (!error) setTrainees(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchTrainees();
        const subscription = supabase.from('trainees').on('*', () => fetchTrainees()).subscribe();
        return () => supabase.removeSubscription(subscription);
    }, []);

    const handleSave = async (data) => {
        const { id, ...dataToSave } = data;
        if (id) {
            await supabase.from('trainees').update(dataToSave).eq('id', id);
        } else {
            await supabase.from('trainees').insert([dataToSave]);
        }
        setIsModalOpen(false);
        setSelected(null);
    };

    const handleDeleteRequest = id => setDeleteConfirm({ show: true, id });
    const handleDeleteConfirm = async () => {
        await supabase.from('trainees').delete().eq('id', deleteConfirm.id);
        setSelected(null);
        setDeleteConfirm({ show: false, id: null });
    };

    const handleEdit = (trainee) => {
        setSelected(trainee);
        setIsModalOpen(true);
    }

    const filtered = trainees.filter(t => t.fullName && t.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (<div className="p-4 md:p-8 space-y-6"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><div className="relative w-full md:w-1/2"><input type="text" placeholder="ابحث عن اسم المتدرب..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div><Button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 w-full md:w-auto flex items-center justify-center gap-2"><PlusCircleIcon className="w-5 h-5" />إضافة متدرب جديد</Button></div><div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6"><div className="bg-gray-800 rounded-xl p-4 overflow-y-auto max-h-[65vh]"><h3 className="text-lg font-semibold text-white mb-3">قائمة المتدربين</h3>{loading ? <p className="text-gray-400">جاري التحميل...</p> : <ul className="space-y-2">{filtered.length > 0 ? filtered.map(item => (<li key={item.id} onClick={() => setSelected(item)} className={`p-3 rounded-lg cursor-pointer transition ${selected?.id === item.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>{item.fullName}</li>)) : <p className="text-gray-400 text-center p-4">لا يوجد متدربون.</p>}</ul>}</div><div className="min-h-[300px]">{selected ? <TraineeDetails trainee={selected} onEdit={handleEdit} onDelete={handleDeleteRequest} /> : <div className="flex justify-center items-center h-full bg-gray-800 rounded-xl"><p className="text-gray-400">الرجاء اختيار متدرب لعرض التفاصيل</p></div>}</div></div><Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? "تعديل بيانات المتدرب" : "إضافة متدرب جديد"}><TraineeForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} trainee={selected} /></Modal><ConfirmationModal show={deleteConfirm.show} onCancel={() => setDeleteConfirm({ show: false, id: null })} onConfirm={handleDeleteConfirm} message="هل أنت متأكد من حذف هذا المتدرب؟ لا يمكن التراجع." /></div>);
};


// --- Trainers Section ---
const TrainerForm = ({ onSave, onCancel, trainer }) => {
    const [formData, setFormData] = useState({ fullName: '', nationalId: '', phoneNumber: '', address: '', dob: '', motherName: '', education: '', contractStart: '', contractEnd: '', contractTerminationReason: '', courses: [], cv_file_name: '' });
    const [pdfFile, setPdfFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    useEffect(() => { if (trainer) { setFormData({...trainer, courses: trainer.courses || [], cv_file_name: trainer.cv_file_name || ''}); } else { setFormData({ fullName: '', nationalId: '', phoneNumber: '', address: '', dob: '', motherName: '', education: '', contractStart: '', contractEnd: '', contractTerminationReason: '', courses: [], cv_file_name: '' }); } }, [trainer]);
    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleCourseChange = (index, event) => { const newCourses = formData.courses.map((course, i) => i === index ? { ...course, [event.target.name]: event.target.value } : course); setFormData(p => ({ ...p, courses: newCourses })); };
    const addCourse = () => { setFormData(p => ({ ...p, courses: [...p.courses, { name: '', hours: '' }] })); };
    const removeCourse = (index) => { setFormData(p => ({ ...p, courses: p.courses.filter((_, i) => i !== index) })); };
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file && file.type === "application/pdf") { setPdfFile(file); } else { setPdfFile(null); } };
    const handleSave = async (e) => { e.preventDefault(); setUploading(true); let finalData = {...formData}; if (pdfFile) { const fileName = `${Date.now()}-${pdfFile.name}`; const { error } = await supabase.storage.from('cvs').upload(fileName, pdfFile); if (error) { alert(`خطأ في الرفع: ${error.message}`); setUploading(false); return; } finalData.cv_file_name = fileName; } delete finalData.id; await onSave(finalData, trainer?.id); setUploading(false); };
    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="الاسم الثلاثي" name="fullName" value={formData.fullName} onChange={handleChange} required />
                <Input label="الرقم الوطني" name="nationalId" value={formData.nationalId} onChange={handleChange} />
                <Input label="رقم الهاتف" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                <Input label="السكن" name="address" value={formData.address} onChange={handleChange} />
                <Input label="تاريخ الميلاد" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                <Input label="اسم الأم" name="motherName" value={formData.motherName} onChange={handleChange} />
                <Input label="التحصيل العلمي" name="education" value={formData.education} onChange={handleChange} />
                <Input label="تاريخ بداية التعاقد" name="contractStart" type="date" value={formData.contractStart} onChange={handleChange} />
                <Input label="تاريخ انتهاء التعاقد" name="contractEnd" type="date" value={formData.contractEnd} onChange={handleChange} />
            </div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">رفع السيرة الذاتية (PDF)</label><input type="file" accept=".pdf" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />{pdfFile ? <p className="text-xs text-green-400 mt-1">{pdfFile.name}</p> : (formData.cv_file_name && <p className="text-xs text-gray-400 mt-1">الملف الحالي: {formData.cv_file_name}</p>)}</div>
            <Textarea label="هل تم فسخ العقد ولماذا؟" name="contractTerminationReason" value={formData.contractTerminationReason} onChange={handleChange} />
            <div className="space-y-4 rounded-lg border border-gray-600 p-4"><h4 className="font-semibold text-lg text-white">الكورسات التي يدربها</h4>{formData.courses.map((course, index) => (<div key={index} className="flex items-end gap-2 md:gap-4 p-2 bg-gray-900/50 rounded-md"><div className="flex-1"><Input label="اسم الكورس" name="name" value={course.name} onChange={(e) => handleCourseChange(index, e)} placeholder="مثال: React متقدم" /></div><div className="w-28"><Input label="عدد الساعات" name="hours" type="number" value={course.hours} onChange={(e) => handleCourseChange(index, e)} placeholder="مثال: 40" /></div><Button onClick={() => removeCourse(index)} className="bg-red-600 hover:bg-red-500 !p-2 h-10"><TrashIcon className="w-5 h-5"/></Button></div>))}{<Button onClick={addCourse} type="button" className="bg-green-600 hover:bg-green-500 flex items-center gap-2 mt-2"><PlusCircleIcon className="w-5 h-5"/>إضافة كورس</Button>}</div>
            <div className="flex justify-end items-center gap-4 pt-4"><Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">إلغاء</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={uploading}>{uploading ? 'جاري الحفظ...' : 'حفظ البيانات'}</Button></div>
        </form>
    );
};
const TrainerDetails = ({ trainer, onEdit, onDelete }) => {
    if (!trainer) return null;
    const { data: cvUrlData } = supabase.storage.from('cvs').getPublicUrl(trainer.cv_file_name || '');
    return (<div className="bg-gray-800 p-6 rounded-xl space-y-4 animate-fade-in"><div className="flex justify-between items-start"><h3 className="text-2xl font-bold text-white">{trainer.fullName}</h3><div className="flex gap-2"><Button onClick={() => onEdit(trainer)} className="bg-blue-600 hover:bg-blue-500 text-sm !py-1 !px-3">تعديل</Button><Button onClick={() => onDelete(trainer.id)} className="bg-red-600 hover:bg-red-500 text-sm !py-1 !px-3"><TrashIcon className="w-4 h-4 inline-block ml-1"/>حذف</Button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm"><DetailItem label="الرقم الوطني" value={trainer.nationalId} /><DetailItem label="رقم الهاتف" value={trainer.phoneNumber} /><DetailItem label="السكن" value={trainer.address} /><DetailItem label="تاريخ الميلاد" value={trainer.dob} /><DetailItem label="اسم الأم" value={trainer.motherName} /><DetailItem label="التحصيل" value={trainer.education} /><DetailItem label="بداية العقد" value={trainer.contractStart} /><DetailItem label="نهاية العقد" value={trainer.contractEnd} /></div><div className="pt-4 space-y-4"><h4 className="font-bold text-lg text-blue-300">معلومات إضافية</h4><DetailItem label="سبب فسخ العقد" value={trainer.contractTerminationReason} />{trainer.cv_file_name && <DetailItem label="السيرة الذاتية (CV)" value={<a href={cvUrlData?.publicURL} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{trainer.cv_file_name}</a>} /> }<div><h5 className="font-bold text-md text-blue-400 mb-2">الكورسات التي يدربها</h5>{trainer.courses && trainer.courses.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-2">{trainer.courses.map((course, index) => (<div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center text-sm"><span>{course.name}</span><span className="text-blue-300 font-semibold">{course.hours} ساعة</span></div>))}</div>) : (<p className="text-gray-400 text-sm p-3 bg-gray-700 rounded-lg">لم يتم إضافة كورسات لهذا المدرب.</p>)}</div><div className="space-y-2 text-sm text-gray-300"><p>الأجور التي حصل عليها: لم يتم إضافة هذه الميزة بعد.</p></div></div></div>);
};
const TrainersView = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

    const fetchTrainers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('trainers').select('*').order('fullName');
        if (!error) setTrainers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchTrainers();
        const subscription = supabase.from('trainers').on('*', () => fetchTrainers()).subscribe();
        return () => supabase.removeSubscription(subscription);
    }, []);

    const handleSave = async (data, id) => {
        if (id) {
            await supabase.from('trainers').update(data).eq('id', id);
        } else {
            await supabase.from('trainers').insert([data]);
        }
        setIsModalOpen(false);
        setSelected(null);
    };

    const handleDeleteRequest = id => setDeleteConfirm({ show: true, id });
    const handleDeleteConfirm = async () => {
        await supabase.from('trainers').delete().eq('id', deleteConfirm.id);
        setSelected(null);
        setDeleteConfirm({ show: false, id: null });
    };

    const handleEdit = (trainer) => {
        setSelected(trainer);
        setIsModalOpen(true);
    }

    const filtered = trainers.filter(t => t.fullName && t.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (<div className="p-4 md:p-8 space-y-6"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><div className="relative w-full md:w-1/2"><input type="text" placeholder="ابحث عن اسم المدرب..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div><Button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 w-full md:w-auto flex items-center justify-center gap-2"><PlusCircleIcon className="w-5 h-5" />إضافة مدرب جديد</Button></div><div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6"><div className="bg-gray-800 rounded-xl p-4 overflow-y-auto max-h-[65vh]"><h3 className="text-lg font-semibold text-white mb-3">قائمة المدربين</h3>{loading ? <p className="text-gray-400">جاري التحميل...</p> :<ul className="space-y-2">{filtered.length > 0 ? filtered.map(item => (<li key={item.id} onClick={() => setSelected(item)} className={`p-3 rounded-lg cursor-pointer transition ${selected?.id === item.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>{item.fullName}</li>)) : <p className="text-gray-400 text-center p-4">لا يوجد مدربون.</p>}</ul>}</div><div className="min-h-[300px]">{selected ? <TrainerDetails trainer={selected} onEdit={handleEdit} onDelete={handleDeleteRequest} /> : <div className="flex justify-center items-center h-full bg-gray-800 rounded-xl"><p className="text-gray-400">الرجاء اختيار مدرب لعرض التفاصيل</p></div>}</div></div><Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? "تعديل بيانات المدرب" : "إضافة مدرب جديد"}><TrainerForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} trainer={selected} /></Modal><ConfirmationModal show={deleteConfirm.show} onCancel={() => setDeleteConfirm({ show: false, id: null })} onConfirm={handleDeleteConfirm} message="هل أنت متأكد من حذف هذا المدرب؟ لا يمكن التراجع." /></div>);
};


// --- Scheduling Section (Now Active) ---
const Calendar = ({ onSelectDate, schedule, currentDate }) => {
    const [date, setDate] = useState(currentDate);
    useEffect(() => setDate(currentDate), [currentDate]);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => new Date(date.getFullYear(), date.getMonth(), i + 1));
    const startingDayIndex = startOfMonth.getDay();
    const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    const today = new Date(); today.setHours(0,0,0,0);
    return (
        <div className="bg-gray-800 p-4 rounded-xl"><div className="flex justify-between items-center mb-4"><button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-700"><ChevronRightIcon className="w-6 h-6 text-white" /></button><h3 className="text-xl font-bold text-white">{date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</h3><button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeftIcon className="w-6 h-6 text-white" /></button></div><div className="grid grid-cols-7 gap-1 text-center font-semibold text-blue-300">{['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => <div key={d} className="py-2">{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{Array.from({ length: startingDayIndex }).map((_, i) => <div key={`e-${i}`}></div>)}{daysInMonth.map(day => { const dayStr = day.toISOString().split('T')[0]; const hasEvent = schedule.some(e => e.date === dayStr); const isToday = day.getTime() === today.getTime(); return (<div key={day.toString()} onClick={() => onSelectDate(day)} className={`py-2 h-16 flex flex-col items-center justify-center rounded-lg cursor-pointer transition border-2 ${isToday ? 'border-blue-500' : 'border-transparent'} hover:bg-gray-700`}><span className={`font-semibold ${isToday ? 'text-blue-400' : 'text-white'}`}>{day.getDate()}</span>{hasEvent && <div className="w-2 h-2 bg-green-400 rounded-full mt-1"></div>}</div>); })}</div></div>
    );
};
const ScheduleForm = ({ onSave, onCancel, date, eventToEdit }) => {
    const [formData, setFormData] = useState({ date: date.toISOString().split('T')[0], courseName: '', hallName: '', courseCategory: '', startTime: '', endTime: '', courseDays: '', traineeCount: '', germanBoardApplicants: '', trainerApology: '', traineeApology: '', coursePlan: '', requiredMaterials: '' });
    useEffect(() => { if (eventToEdit) setFormData(eventToEdit); else setFormData({ date: date.toISOString().split('T')[0], courseName: '', hallName: '', courseCategory: '', startTime: '', endTime: '', courseDays: '', traineeCount: '', germanBoardApplicants: '', trainerApology: '', traineeApology: '', coursePlan: '', requiredMaterials: '' }) }, [eventToEdit, date]);
    const handleChange = e => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-bold text-lg text-white">{(eventToEdit ? 'تعديل' : 'إضافة')} حدث ليوم {new Date(formData.date).toLocaleDateString('ar-EG')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="اسم الكورس" name="courseName" value={formData.courseName} onChange={handleChange} required/>
                <Input label="تصنيف الكورس" name="courseCategory" value={formData.courseCategory} onChange={handleChange}/>
                <Input label="اسم القاعة" name="hallName" value={formData.hallName} onChange={handleChange} required/>
                <Input label="أيام الكورس (مثال: سبت، اثنين)" name="courseDays" value={formData.courseDays} onChange={handleChange}/>
                <Input label="وقت البدء" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required/>
                <Input label="وقت الانتهاء" name="endTime" type="time" value={formData.endTime} onChange={handleChange} required/>
                <Input label="عدد المتدربين" name="traineeCount" type="number" value={formData.traineeCount} onChange={handleChange}/>
            </div>
            <Textarea label="أسماء المقدمين لشهادة البورد الألماني" name="germanBoardApplicants" value={formData.germanBoardApplicants} onChange={handleChange}/>
            <Textarea label="خطة مسار الكورس" name="coursePlan" value={formData.coursePlan} onChange={handleChange}/>
            <Textarea label="المواد/الأدوات المطلوبة" name="requiredMaterials" value={formData.requiredMaterials} onChange={handleChange}/>
            <Textarea label="هل تم الاعتذار من قبل المدرب ولماذا؟" name="trainerApology" value={formData.trainerApology} onChange={handleChange}/>
            <Textarea label="هل تم الاعتذار من قبل المتدرب ولماذا؟" name="traineeApology" value={formData.traineeApology} onChange={handleChange}/>
            <div className="flex justify-end items-center gap-4 pt-4"><Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">إلغاء</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-500">حفظ الحدث</Button></div>
        </form>
    );
};
const SchedulingView = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
    
    const fetchSchedule = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('schedule').select('*');
        if(!error) setSchedule(data || []);
        setLoading(false);
    }
    
    useEffect(() => {
        fetchSchedule();
        const subscription = supabase.from('schedule').on('*', () => fetchSchedule()).subscribe();
        return () => supabase.removeSubscription(subscription);
    }, []);

    const handleSaveSchedule = async (data) => {
        const { id, ...dataToSave } = data;
        if (id) {
            await supabase.from('schedule').update(dataToSave).eq('id', id);
        } else {
            await supabase.from('schedule').insert([dataToSave]);
        }
        setIsModalOpen(false);
        setEventToEdit(null);
    };

    const handleDeleteRequest = id => setDeleteConfirm({ show: true, id });
    const handleDeleteConfirm = async () => {
        await supabase.from('schedule').delete().eq('id', deleteConfirm.id);
        setDeleteConfirm({ show: false, id: null });
    };

    const handleEdit = (event) => { setEventToEdit(event); setIsModalOpen(true); };
    const eventsForSelectedDay = schedule.filter(e => e.date === selectedDate.toISOString().split('T')[0]);

    return (
        <div className="p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                <div><Calendar onSelectDate={setSelectedDate} schedule={schedule} currentDate={selectedDate} /></div>
                <div className="bg-gray-800 p-6 rounded-xl min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">جدول يوم: {selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                        <Button onClick={() => { setEventToEdit(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 flex items-center gap-2 text-sm"><PlusCircleIcon className="w-5 h-5"/>إضافة حدث</Button>
                    </div>
                    {loading ? <p className="text-gray-400">جاري التحميل...</p> : <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">{eventsForSelectedDay.length > 0 ? eventsForSelectedDay.map(event => (<div key={event.id} className="bg-gray-700 p-4 rounded-lg"><div className="flex justify-between items-start mb-2"><div onClick={() => handleEdit(event)} className="cursor-pointer flex-1"><p className="font-bold text-blue-300 text-lg">{event.courseName}</p><p className="text-sm text-gray-300">القاعة: {event.hallName} | الوقت: {event.startTime} - {event.endTime}</p></div><Button onClick={() => handleDeleteRequest(event.id)} className="bg-red-600 hover:bg-red-500 !p-2"><TrashIcon className="w-4 h-4"/></Button></div><div className="text-xs text-gray-400 space-y-2 border-t border-gray-600 pt-2 mt-2"><p><strong className="text-gray-200">الأيام:</strong> {event.courseDays || 'N/A'}</p><p><strong className="text-gray-200">العدد:</strong> {event.traineeCount || 'N/A'}</p><p><strong className="text-gray-200">خطة الكورس:</strong> {event.coursePlan || 'N/A'}</p></div></div>)) : <p className="text-gray-400 text-center pt-10">لا توجد مواعيد في هذا اليوم.</p>}</div>}
                </div>
            </div>
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title={eventToEdit ? "تعديل حدث" : "جدولة كورس جديد"}><ScheduleForm onSave={handleSaveSchedule} onCancel={() => setIsModalOpen(false)} date={selectedDate} eventToEdit={eventToEdit}/></Modal>
            <ConfirmationModal show={deleteConfirm.show} onCancel={() => setDeleteConfirm({ show: false, id: null })} onConfirm={handleDeleteConfirm} message="هل أنت متأكد من حذف هذا الحدث؟" />
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [activeTab, setActiveTab] = useState('trainers');
    return (
        <div dir="rtl" className="flex h-screen bg-gray-900 text-white font-[Tajawal,sans-serif]">
            <aside className="w-64 bg-gray-800 p-6 flex flex-col justify-between shadow-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-white text-center mb-10">مركز صلة التدريبي</h1>
                    <nav className="space-y-4">
                        <button onClick={() => setActiveTab('trainees')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg w-full text-right transition-colors duration-200 ${activeTab === 'trainees' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'}`}><UserIcon className="w-6 h-6"/><span>المتدربون</span></button>
                        <button onClick={() => setActiveTab('trainers')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg w-full text-right transition-colors duration-200 ${activeTab === 'trainers' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'}`}><TeacherIcon className="w-6 h-6"/><span>المدربون</span></button>
                        <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg w-full text-right transition-colors duration-200 ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'}`}><CalendarIcon className="w-6 h-6"/><span>الجدولة</span></button>
                    </nav>
                </div>
                <div className="text-center text-xs text-gray-500"><p>مدعوم بواسطة Supabase</p><p className="text-red-400 mt-2">مفاتيح وهمية - استبدلها</p></div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {activeTab === 'trainees' && <TraineesView />}
                {activeTab === 'trainers' && <TrainersView />}
                {activeTab === 'schedule' && <SchedulingView />}
            </main>
        </div>
    );
}
