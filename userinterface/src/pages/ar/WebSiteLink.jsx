import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    MdSlideshow,
    MdArticle,
    MdCategory,
    MdContactMail,
    MdSettings,
    MdArrowBack,
} from "react-icons/md";

/**
 * Website Pages Distribution
 * Each card navigates to its own page.
 * Set `comingSoon: true` to disable a card until the page is built.
 */
const WebSiteLink = () => {
    const pages = [
        {
            name: "السلايدر",
            nameEn: "Slider",
            path: "/ar-slider",
            icon: MdSlideshow,
            description: "إدارة صور السلايدر الرئيسي للموقع",
            color: "#4285F4",
            available: true,
        },
        {
            name: "المقالات",
            nameEn: "Blog Posts",
            path: "/ar-blog",
            icon: MdArticle,
            description: "إدارة مقالات ومدونة الموقع",
            color: "#34A853",
            available: false,
        },
        {
            name: "التصنيفات",
            nameEn: "Categories",
            path: "/ar-categories",
            icon: MdCategory,
            description: "إدارة تصنيفات المحتوى",
            color: "#FBBC05",
            available: false,
        },
        {
            name: "تواصل معنا",
            nameEn: "Contact",
            path: "/ar-contact",
            icon: MdContactMail,
            description: "إدارة بيانات التواصل ورسائل العملاء",
            color: "#EA4335",
            available: false,
        },
        {
            name: "إعدادات الموقع",
            nameEn: "Site Settings",
            path: "/ar-site-settings",
            icon: MdSettings,
            description: "إعدادات عامة لموقع الشركة",
            color: "#a47d52",
            available: false,
        },
    ];

    const handleClick = (e, page) => {
        if (!page.available) {
            e.preventDefault();
            toast.info(`صفحة "${page.name}" قيد الإنشاء — قريباً ✨`);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 rtl">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 mb-10 md:mb-14">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 lg:shadow-lg p-6 rounded-2xl bg-white/60 backdrop-blur-sm">
                    <div className="text-center sm:text-right">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                            إدارة الموقع الإلكتروني
                        </h2>
                        <p className="text-base md:text-lg text-gray-600 mt-1">
                            اختر القسم الذي تريد إدارته من شركة بروكر سيتي
                        </p>
                    </div>

                    {/* Back to dashboard */}
                    <Link
                        to="/ar-dashboard"
                        className="
                            flex items-center gap-2
                            bg-white hover:bg-[#f8f7f5]
                            text-[#a47d52] border border-[#a47d52]
                            px-5 py-2.5 rounded-sm font-extrabold text-sm
                            transition-all duration-300
                            hover:scale-105 active:scale-95
                            whitespace-nowrap
                        "
                    >
                        <MdArrowBack className="text-lg" />
                        العودة للوحة التحكم
                    </Link>
                </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
                {pages.map((page) => {
                    const Icon = page.icon;
                    const CardWrapper = page.available ? Link : "div";
                    const wrapperProps = page.available
                        ? { to: page.path }
                        : {};

                    return (
                        <CardWrapper
                            key={page.path}
                            {...wrapperProps}
                            onClick={(e) => handleClick(e, page)}
                            className={`
                                relative group bg-white rounded-2xl
                                shadow-md hover:shadow-xl
                                transition-all duration-300
                                overflow-hidden
                                border border-gray-100
                                ${page.available
                                    ? "hover:-translate-y-2 cursor-pointer"
                                    : "opacity-70 cursor-not-allowed hover:-translate-y-1"
                                }
                            `}
                        >
                            {/* Top colored strip */}
                            <div
                                className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
                                style={{ backgroundColor: page.color }}
                            />

                            {/* Coming soon badge */}
                            {!page.available && (
                                <span
                                    className="
                                        absolute top-4 left-4
                                        px-3 py-1 rounded-full
                                        text-[10px] font-extrabold
                                        bg-gray-100 text-gray-500
                                        tracking-wide
                                    "
                                >
                                    قريباً
                                </span>
                            )}

                            <div className="p-6 md:p-8 flex flex-col items-center text-center">
                                {/* Icon circle */}
                                <div
                                    className="
                                        w-20 h-20 rounded-full
                                        flex items-center justify-center
                                        mb-5
                                        transition-all duration-300
                                        group-hover:scale-110
                                        border-b-2
                                    "
                                    style={{
                                        backgroundColor: `${page.color}15`,
                                        borderBottomColor: page.color,
                                    }}
                                >
                                    <Icon
                                        size={38}
                                        style={{ color: page.color }}
                                        className="transition-transform duration-300 group-hover:rotate-6"
                                    />
                                </div>

                                {/* Arabic name */}
                                <h3 className="text-xl font-extrabold text-gray-800 mb-1">
                                    {page.name}
                                </h3>

                                {/* English name */}
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider uppercase">
                                    {page.nameEn}
                                </p>

                                {/* Description */}
                                <p className="text-sm text-gray-500 leading-relaxed mb-6 min-h-[40px]">
                                    {page.description}
                                </p>

                                {/* Action button */}
                                <div className="w-full border-t border-gray-100 pt-5 mt-auto">
                                    <div
                                        className={`
                                            w-full py-2.5 px-4 rounded-xs
                                            font-extrabold text-sm
                                            text-white
                                            transition-all duration-300
                                            flex items-center justify-center gap-2
                                            ${page.available
                                                ? "hover:scale-105 active:scale-95 shadow-lg"
                                                : "opacity-60"
                                            }
                                        `}
                                        style={{ backgroundColor: page.color }}
                                    >
                                        {page.available ? "الدخول" : "قيد الإنشاء"}
                                    </div>
                                </div>
                            </div>
                        </CardWrapper>
                    );
                })}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 mt-12">
                © {new Date().getFullYear()} Broker City — جميع الحقوق محفوظة
            </p>
        </div>
    );
};

export default WebSiteLink;