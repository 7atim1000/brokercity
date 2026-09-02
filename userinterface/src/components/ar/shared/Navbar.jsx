// bg-gradient-to-l from-[#a47d52] via-[#f8f7f5] to-[#a47d52]
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

import {
    clearTokens,
    getAccessToken,
    authFetch
} from "../../../utils/auth";

import { SlUserFollow } from "react-icons/sl";
import { MdDashboardCustomize } from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";


const Navbar = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isLoggedIn = !!getAccessToken();


    // Get logged-in user
    useEffect(() => {

        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {

            try {

                const BASE =
                    import.meta.env.VITE_DJANGO_BASE_URL;

                const response = await authFetch(
                    `${BASE}/api/me/`
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to get user information"
                    );
                }

                const data = await response.json();

                setUser(data);

            } catch (error) {

                console.error(
                    "Error fetching user:",
                    error
                );

                clearTokens();
                navigate("/login");

            } finally {

                setLoading(false);

            }
        };

        fetchUser();

    }, [isLoggedIn, navigate]);


    // Logout
    const handleLogout = () => {

        clearTokens();

        navigate("/ar-login");
    };


    // Convert URL to Arabic page name
    const getPageName = () => {

        const path = location.pathname;

        if (path === "/ar-dashboard") {
            return "بروكر سيتي العقارية";
        }

        if (path === "/login") {
            return "تسجيل الدخول";
        }

        if (path === "/signup") {
            return "إنشاء حساب";
        }

        if (path.includes("users")) {
            return "المستخدمون";
        }

        if (path.includes("units")) {
            return "الوحدات";
        }

        if (path.includes("orders")) {
            return "الطلبات";
        }

        if (path.includes("finance")) {
            return "الاداره الماليه";
        }

        return "الصفحة الرئيسية";
    };


    return (

        <nav
            dir="rtl"
            className="
                fixed
                top-0
                left-0
                right-0
                h-13
                bg-gradient-to-l from-[#f8f7f5] to-[#a47d52]
                border-b
                border-[#f8f7f5]
                shadow-[0_0_7px_rgba(0,0,0,0.4)]
                z-50
                px-4
                sm:px-6
                
            "
        >

            <div
                className="
                    h-full
                    flex
                    items-center
                    justify-between
                    gap-4
                "
            >

                {/* Page Address */}
                <div className="flex items-center min-w-0">

                    <h1
                        className="
                            text-base
                            sm:text-2xl
                            
                            text-[#a47d52]
                            truncate
                            font-extrabold
                        "
                    >
                        {getPageName()}
                    </h1>

                </div>


                {/* User Information */}
                <div
                    className="
                        flex
                        items-center
                        gap-3
                        sm:gap-5
                    "
                >

                    {!isLoggedIn ? (

                        <>
                            <Link
                                to="/login"
                                className="
                                    text-gray-700
                                    font-medium
                                    hover:text-blue-600
                                "
                            >
                                تسجيل الدخول
                            </Link>

                            <Link
                                to="/signup"
                                className="
                                    hidden
                                    sm:block
                                    text-gray-700
                                    font-medium
                                    hover:text-blue-600
                                "
                            >
                                إنشاء حساب
                            </Link>
                        </>

                    ) : (

                        <>

                            {/* User */}
                            {!loading && user && (

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    {/* User Image */}
                                    {user.image ? (

                                        <img
                                            src={`
                                                ${import.meta.env.VITE_DJANGO_BASE_URL}
                                                ${user.image}
                                            `}
                                            alt={user.username}
                                            className="
                                                w-9
                                                h-9
                                                sm:w-10
                                                sm:h-10
                                                rounded-full
                                                object-cover
                                                border
                                                border-[#f8f7f5]
                                            "
                                        />

                                    ) : (

                                        <div
                                            className="
                                                w-9
                                                h-9
                                                sm:w-10
                                                sm:h-10
                                                rounded-full
                                                bg-[#f8f7f5]
                                                flex
                                                items-center
                                                justify-center
                                            "
                                        >

                                            <SlUserFollow
                                                size={20}
                                                className="text-gray-600"
                                            />

                                        </div>

                                    )}


                                    {/* Username */}
                                    <span
                                        className="
                                            hidden
                                            sm:block
                                            font-medium
                                            text-[#f8f7f5]
                                        "
                                    >
                                        {user.username}
                                    </span>

                                </div>

                            )}


                            {/* Vendor Dashboard */}
                            {!loading &&
                                user?.role === "vendor" && (

                                    <Link
                                        to="/ar-dashboard"
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            text-blue-600
                                            font-medium
                                            hover:text-blue-800
                                        "
                                    >

                                        <MdDashboardCustomize
                                            size={23}
                                        />

                                        <span className="hidden sm:block">
                                            الرئيسية
                                        </span>

                                    </Link>

                                )}


                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    text-[#f8f7f5]
                                    
                                    transition
                                    cursor-pointer
                                "
                                title="تسجيل الخروج"
                            >

                                <IoMdLogOut
                                    size={26}
                                />

                            </button>

                        </>

                    )}

                </div>

            </div>

        </nav>

    );
};


export default Navbar;