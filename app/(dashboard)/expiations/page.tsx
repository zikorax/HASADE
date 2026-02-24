'use client'

import React from 'react'
import {
    Sparkles,
    Heart,
    Droplets,
    Sunrise,
    Coins,
    Footprints,
    Wind,
    ShieldCheck,
    ScrollText,
    Star,
    CheckCircle2
} from 'lucide-react'

const expiations = [
    {
        title: 'التوبة النصوح',
        description: 'الندم على الذنب، والإقلاع عنه، والعزم على عدم العودة إليه.',
        hadith: 'التائب من الذنب كمن لا ذنب له',
        icon: Heart,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-100'
    },
    {
        title: 'إسباغ الوضوء',
        description: 'إتمام الوضوء وإعطاء كل عضو حقه من الماء بيقين.',
        hadith: 'من توضأ فأحسن الوضوء خرجت خطاياه من جسده حتى تخرج من تحت أظفاره',
        icon: Droplets,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100'
    },
    {
        title: 'الصلوات الخمس',
        description: 'المحافظة على الصلوات في وقتها بخشوع.',
        hadith: 'الصلوات الخمس، والجمعة إلى الجمعة، كفارة لما بينهن ما اجتنبت الكبائر',
        icon: Sunrise,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
    },
    {
        title: 'الصدقة',
        description: 'الإنفاق من مال الله لتطهير النفس ومساعدة المحتاجين.',
        hadith: 'الصدقة تطفئ الخطيئة كما يطفئ الماء النار',
        icon: Coins,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100'
    },
    {
        title: 'ذكر الله (100 مرة)',
        description: 'قول "سبحان الله وبحمده" مائة مرة يومياً.',
        hadith: 'من قال: سبحان الله وبحمده في يوم مائة مرة، حطت خطاياه وإن كانت مثل زبد البحر',
        icon: Sparkles,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100'
    },
    {
        title: 'كثرة الخطى للمساجد',
        description: 'المشي للصلاة في المسجد يرفع الدرجات ويحط السيئات.',
        hadith: 'ألا أدلكم على ما يمحو الله به الخطايا ويرفع به الدرجات؟... كثرة الخطا إلى المساجد',
        icon: Footprints,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-100'
    },
    {
        title: 'الاستغفار',
        description: 'المداومة على طلب المغفرة من الله باللسان والقلب.',
        hadith: 'من لزم الاستغفار جعل الله له من كل هم فرجاً ومن كل ضيق مخرجاً',
        icon: Wind,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        border: 'border-cyan-100'
    },
    {
        title: 'الصبر على البلاء',
        description: 'الرضا بقضاء الله عند المصائب والاحتساب.',
        hadith: 'ما يصيب المسلم من نصب ولا وصب... إلا كفر الله بها من خطاياه',
        icon: ShieldCheck,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-100'
    }
]

export default function ExpiationsPage() {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4 pb-32" dir="rtl">
            {/* Header Section */}
            <header className="text-center mb-16 relative overflow-hidden p-12 rounded-[3rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                        <Sparkles className="text-indigo-300" size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">مكفرات الذنوب والسيئات</h1>
                    <p className="text-xl text-indigo-100/70 max-w-2xl font-medium leading-relaxed">
                        "إن الحسنات يذهبن السيئات" — رحمة الله الواسعة التي تفتح لنا أبواب الأمل وتطهر نفوسنا من الأدران.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <Star className="text-amber-400" size={16} />
                            <span className="text-sm font-bold">هداية لليقين</span>
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-400" size={16} />
                            <span className="text-sm font-bold">بشرى للمؤمن</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiations.map((item, index) => (
                    <div
                        key={index}
                        className={`group relative p-8 rounded-[2.5rem] bg-white border ${item.border} shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden`}
                    >
                        {/* Background Pattern Hint */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${item.bg} opacity-30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

                        <div className="relative z-10">
                            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
                                <item.icon size={28} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 mb-3">{item.title}</h3>
                            <p className="text-slate-500 mb-6 leading-relaxed font-medium">
                                {item.description}
                            </p>

                            <div className={`p-4 rounded-2xl bg-slate-50 border-r-4 ${item.border.replace('border-', 'border-r-')} text-slate-600 text-sm italic font-medium leading-relaxed`}>
                                <ScrollText size={16} className={`${item.color} mb-2`} />
                                "{item.hadith}"
                            </div>
                        </div>

                        <button className={`mt-6 w-full py-3 rounded-xl ${item.bg} ${item.color} font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-2`}>
                            <CheckCircle2 size={16} />
                            سأعمل بها اليوم
                        </button>
                    </div>
                ))}
            </div>

            {/* Quote Footer Section */}
            <footer className="mt-20 text-center p-10 bg-emerald-50 border border-emerald-100 rounded-[2.5rem]">
                <h2 className="text-emerald-800 font-bold mb-3 flex items-center justify-center gap-2">
                    💡 تذكر دائماً
                </h2>
                <p className="text-emerald-700 leading-relaxed font-medium">
                    أن التوبة تجُبّ ما قبلها، وأن الله يفرح بتوبة عبده المؤمن أكثر مما نتصور.
                    اجعل نيتك اليوم طاهرة، واسعَ في مكلفات الخير، فالحياة قصيرة والحصاد يبقى.
                </p>
            </footer>

            <footer className="mt-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] py-10 border-t border-slate-50">
                حصاد — رحلتك نحو التوازن الروحي والنفسي
            </footer>
        </div>
    )
}
