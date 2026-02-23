import { useLocale } from '@/i18n';
import { StarFilled } from '@ant-design/icons';

const TestimonialsSection = () => {
    const { t } = useLocale();

    const TESTIMONIALS = [
        {
            name: t('home.testimonials.1.name'),
            role: t('home.testimonials.1.role'),
            avatar: 'NL',
            content: t('home.testimonials.1.content'),
            rating: 5,
            bg: 'bg-blue-50',
        },
        {
            name: t('home.testimonials.2.name'),
            role: t('home.testimonials.2.role'),
            avatar: 'TD',
            content: t('home.testimonials.2.content'),
            rating: 5,
            bg: 'bg-green-50',
        },
        {
            name: t('home.testimonials.3.name'),
            role: t('home.testimonials.3.role'),
            avatar: 'QT',
            content: t('home.testimonials.3.content'),
            rating: 5,
            bg: 'bg-purple-50',
        },
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="inline-block px-4 py-1.5 bg-yellow-50 text-yellow-600 text-sm font-semibold rounded-full mb-4">
                        {t('home.testimonials.badge')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{t('home.testimonials.title')}</h2>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map(item => (
                        <div key={item.name} className={`${item.bg} rounded-2xl p-7 flex flex-col gap-5`}>
                            {/* Stars */}
                            <div className="flex gap-1">
                                {Array.from({ length: item.rating }).map((_, i) => (
                                    <StarFilled key={i} className="text-yellow-400 text-sm" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-gray-700 text-sm leading-relaxed italic">"{item.content}"</p>

                            {/* Author */}
                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {item.avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
