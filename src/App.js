import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, Calendar, Users, Briefcase, Search, Plus, X, Upload, ChevronLeft, ChevronRight, User, BookOpen, Clock, Home, Award, DollarSign, Edit2, Trash2 } from 'lucide-react';

// --- تهيئة Supabase ---
// **مهم:** يجب أن تأتي هذه القيم من متغيرات البيئة كما هو موضح في الدليل
// في ملف .env.local للتطوير المحلي، أو في إعدادات Netlify للنشر
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jgvibxicmylwvmeubkdc.supabase.co'; // ضع قيمة URL هنا كحل مؤقت فقط
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndmlieGljbXlsd3ZtZXVia2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODkyODksImV4cCI6MjA2NjQ2NTI4OX0.xq50DkxFGJrrPQ1VWDob6MMaZW4roNcJNY0xjRw5w_0'; // ضع قيمة anon key هنا كحل مؤقت فقط
const supabase = createClient(supabaseUrl, supabaseKey);


// --- مكونات واجهة المستخدم (بدون تغيير) ---

const Tooltip = ({ text, children }) => (
    <div className="relative group flex justify-center">
        {children}
        <span className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {text}
        </span>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" dir="rtl">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-1">
                        <X size={24} />
                    </button>
                </header>
                <main className="p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

const Input = ({ id, label, type = "text", value, onChange, placeholder, required = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
    </div>
);

const Textarea = ({ id, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows="3"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        ></textarea>
    </div>
);

// --- نافذة المتدربين (تم التعديل لتعمل مع Supabase) ---
const TraineesView = () => {
    const [trainees, setTrainees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTrainee, setSelectedTrainee] = useState(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newTrainee, setNewTrainee] = useState({
        fullName: '', phone: '', address: '', nationalId: '', dob: '', motherName: '', education: '',
        courses: [], payments: [], discounts: [], certificates: [], workshops: []
    });

    // دالة لجلب البيانات من Supabase
    const fetchTrainees = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('trainees')
            .select('*')
            .order('created_at', { ascending: false }); // ترتيب حسب الأحدث

        if (error) {
            console.error('Error fetching trainees:', error);
            alert('حدث خطأ أثناء جلب بيانات المتدربين.');
        } else {
            setTrainees(data);
        }
        setIsLoading(false);
    }, []);

    // جلب البيانات الأولية والاشتراك في التحديثات
    useEffect(() => {
        fetchTrainees();

        // إعداد اشتراك Realtime
        const subscription = supabase
            .channel('public:trainees')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trainees' }, (payload) => {
                console.log('Change received!', payload);
                fetchTrainees(); // إعادة جلب البيانات عند حدوث أي تغيير
            })
            .subscribe();

        // إلغاء الاشتراك عند تفكيك المكون
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [fetchTrainees]);

    // دالة لإضافة متدرب جديد
    const handleAddTrainee = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('trainees')
            .insert([newTrainee]);
        
        if (error) {
            console.error('Error adding trainee:', error);
            alert('حدث خطأ أثناء إضافة المتدرب.');
        } else {
            setNewTrainee({ fullName: '', phone: '', address: '', nationalId: '', dob: '', motherName: '', education: '', courses: [], payments: [], discounts: [], certificates: [], workshops: [] });
            setAddModalOpen(false);
            // لا داعي لـ fetchTrainees() هنا لأن اشتراك Realtime سيقوم بذلك
        }
    };

    const filteredTrainees = trainees.filter(t =>
        t.fullName && t.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">إدارة المتدربين</h1>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <input type="text" placeholder="ابحث عن اسم المتدرب..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                        <Plus size={20} />
                        <span>إضافة متدرب</span>
                    </button>
                </div>
            </header>

            {isLoading ? (
                 <div className="text-center py-10">جاري تحميل البيانات...</div>
            ) : selectedTrainee ? (
                 <TraineeDetails trainee={selectedTrainee} onBack={() => setSelectedTrainee(null)} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTrainees.map(trainee => (
                        <div key={trainee.id} onClick={() => setSelectedTrainee(trainee)} className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-blue-100 p-3 rounded-full"><User className="text-blue-600" size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{trainee.fullName}</h3>
                                    <p className="text-sm text-gray-500">{trainee.phone}</p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p><strong>الرقم الوطني:</strong> {trainee.nationalId || 'غير مسجل'}</p>
                                <p><strong>التحصيل العلمي:</strong> {trainee.education || 'غير مسجل'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="إضافة متدرب جديد">
                <form onSubmit={handleAddTrainee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input id="fullName" label="الاسم الثلاثي" value={newTrainee.fullName} onChange={e => setNewTrainee({...newTrainee, fullName: e.target.value})} required placeholder="مثال: أحمد محمد علي" />
                    <Input id="phone" label="رقم الهاتف" type="tel" value={newTrainee.phone} onChange={e => setNewTrainee({...newTrainee, phone: e.target.value})} placeholder="مثال: 0912345678" />
                    <Input id="address" label="السكن" value={newTrainee.address} onChange={e => setNewTrainee({...newTrainee, address: e.target.value})} placeholder="مثال: دمشق، المزة" />
                    <Input id="nationalId" label="الرقم الوطني" value={newTrainee.nationalId} onChange={e => setNewTrainee({...newTrainee, nationalId: e.target.value})} placeholder="11 خانة رقمية" />
                    <Input id="dob" label="تاريخ التولد" type="date" value={newTrainee.dob} onChange={e => setNewTrainee({...newTrainee, dob: e.target.value})} />
                    <Input id="motherName" label="اسم الأم" value={newTrainee.motherName} onChange={e => setNewTrainee({...newTrainee, motherName: e.target.value})} placeholder="مثال: فاطمة" />
                    <Input id="education" label="التحصيل العلمي" value={newTrainee.education} onChange={e => setNewTrainee({...newTrainee, education: e.target.value})} placeholder="مثال: بكالوريوس هندسة" />
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setAddModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// تم تعديل هذا المكون ليعرض البيانات الحقيقية
const TraineeDetails = ({ trainee, onBack }) => {
    // استخدام البيانات الحقيقية من كائن `trainee` مع قيم افتراضية آمنة
    const courses = trainee.courses || [];
    const payments = trainee.payments || [];
    const discounts = trainee.discounts || [];
    const certificates = trainee.certificates || [];
    const workshops = trainee.workshops || [];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-semibold">
                <ArrowRight size={20} />
                <span>العودة إلى قائمة المتدربين</span>
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-6">
                         <div className="bg-blue-100 p-4 rounded-full"><User size={32} className="text-blue-600"/></div>
                         <div>
                            <h2 className="text-2xl font-bold text-gray-900">{trainee.fullName}</h2>
                            <p className="text-gray-500">{trainee.phone}</p>
                         </div>
                    </div>
                    <div className="space-y-3 text-gray-700">
                        <p><strong>السكن:</strong> {trainee.address || 'غير محدد'}</p>
                        <p><strong>الرقم الوطني:</strong> {trainee.nationalId || 'غير محدد'}</p>
                        <p><strong>تاريخ التولد:</strong> {trainee.dob || 'غير محدد'}</p>
                        <p><strong>اسم الأم:</strong> {trainee.motherName || 'غير محدد'}</p>
                        <p><strong>التحصيل العلمي:</strong> {trainee.education || 'غير محدد'}</p>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <DetailCard icon={<BookOpen />} title="الكورسات المسجلة">
                        {courses.length > 0 ? courses.map((c, i) => <div key={i} className="p-3 bg-blue-50 rounded-lg mb-2">
                             <p className="font-semibold">{c.name} - <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${c.status === 'مكتمل' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{c.status}</span></p>
                             <p className="text-xs text-gray-500">تاريخ التسجيل: {c.date} | السعر: <del>${c.priceBefore}</del> ${c.priceAfter}</p>
                        </div>) : <p className="text-sm text-gray-500">لا توجد كورسات مسجلة.</p>}
                    </DetailCard>
                    <DetailCard icon={<DollarSign />} title="الدفعات المالية والحسومات">
                        <p className="font-semibold mb-2">الدفعات:</p>
                        {payments.length > 0 ? payments.map((p, i) => <p key={i} className="text-sm">{p.course}: ${p.amount} ({p.status})</p>) : <p className="text-sm text-gray-500">لا توجد دفعات.</p>}
                         <p className="font-semibold mt-4 mb-2">الحسومات المستفاد منها:</p>
                        {discounts.length > 0 ? discounts.map((d, i) => <p key={i} className="text-sm">{d.offer} (خصم {d.value})</p>) : <p className="text-sm text-gray-500">لا توجد حسومات.</p>}
                    </DetailCard>
                     <DetailCard icon={<Award />} title="الشهادات والورشات">
                        <p className="font-semibold mb-2">الشهادات:</p>
                        {certificates.length > 0 ? certificates.map((c, i) => <p key={i} className="text-sm">{c.name}: {c.received ? 'تم الحصول عليها' : `لم تحصل (${c.reason})`}</p>) : <p className="text-sm text-gray-500">لا توجد شهادات.</p>}
                         <p className="font-semibold mt-4 mb-2">حضور ورشات / إيفنتات:</p>
                        {workshops.length > 0 ? workshops.map((w, i) => <p key={i} className="text-sm">- {w}</p>) : <p className="text-sm text-gray-500">لم يحضر أي ورشات.</p>}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

const DetailCard = ({icon, title, children}) => (
    <div className="bg-gray-50 p-5 rounded-xl border">
        <div className="flex items-center gap-3 mb-4">
            <div className="text-blue-600">{React.cloneElement(icon, { size: 22 })}</div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        <div>{children}</div>
    </div>
);


// --- نافذة المدربين (واجهة مبدئية، بدون تغيير) ---
const TrainersView = () => {
    const [trainers, setTrainers] = useState([
        { id: 1, fullName: 'علياء منصور', specialty: 'تطوير الويب', contractEnd: '2024-12-31' },
        { id: 2, fullName: 'سامر الأحمد', specialty: 'إدارة المشاريع', contractEnd: '2025-06-30' },
    ]);
    const [isAddModalOpen, setAddModalOpen] = useState(false);

    return (
        <div className="p-6 md:p-8">
            {/* ... نفس كود الواجهة السابق ... */}
            <p className="text-center text-gray-500 mt-10">قسم المدربين قيد التطوير...</p>
        </div>
    );
};

// --- نافذة جدولة المواعيد (واجهة مبدئية، بدون تغيير) ---
const ScheduleView = () => {
    // ... نفس كود الواجهة السابق ...
    return (
        <div className="p-6 md:p-8">
             <p className="text-center text-gray-500 mt-10">قسم الجدولة قيد التطوير...</p>
        </div>
    );
};


// --- المكون الرئيسي للتطبيق ---
export default function App() {
    const [activeView, setActiveView] = useState('trainees');

    const navItems = [
        { id: 'trainees', label: 'المتدربين', icon: Users },
        { id: 'trainers', label: 'المدربين', icon: Briefcase },
        { id: 'schedule', label: 'الجدول الزمني', icon: Calendar },
    ];

    const renderView = () => {
        switch (activeView) {
            case 'trainees': return <TraineesView />;
            case 'trainers': return <TrainersView />;
            case 'schedule': return <ScheduleView />;
            default: return <TraineesView />;
        }
    };
    
    return (
        <div dir="rtl" className="flex h-screen bg-gray-100 font-sans">
            <aside className="w-20 lg:w-64 bg-white shadow-lg flex flex-col transition-all duration-300">
                <div className="flex items-center justify-center lg:justify-start gap-3 p-4 border-b h-20">
                    <img src="https://placehold.co/40x40/3B82F6/FFFFFF?text=S" alt="شعار مركز صلة" className="rounded-full" />
                    <span className="hidden lg:block text-xl font-bold text-gray-800">مركز صلة</span>
                </div>
                <nav className="flex-grow mt-6">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.id} className="px-4 mb-2">
                                <button
                                    onClick={() => setActiveView(item.id)}
                                    className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-lg transition-colors ${
                                        activeView === item.id 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <item.icon size={24} />
                                    <span className="hidden lg:block font-semibold">{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                 <div className="p-4 border-t text-xs text-gray-500 hidden lg:block">
                     <p>إصدار 1.1.0 (Supabase)</p>
                     <p>&copy; 2024 مركز صلة الدولي</p>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
}
