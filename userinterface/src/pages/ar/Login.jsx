import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveTokens } from "../../utils/auth";
import logo from '../../assets/images/logo.png';
import background from "../../assets/images/background.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaLanguage } from "react-icons/fa6";



function Login() {
    const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [loginMode, setLoginMode] = useState(null);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const passwordRef = useRef(null);


    // ---------------------------------------------
    // Handle input changes
    // ---------------------------------------------

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };


    // ---------------------------------------------
    // Select User Login
    // ---------------------------------------------

    const handleUserLogin = (username) => {

        setLoginMode(username);

        setForm({
            username: username,
            password: "",
        });

        setMsg("");

        // Focus password input automatically
        setTimeout(() => {
            passwordRef.current?.focus();
        }, 0);
    };


    // ---------------------------------------------
    // Return to normal login
    // ---------------------------------------------

    const handleNormalLogin = () => {

        setLoginMode(null);

        setForm({
            username: "",
            password: "",
        });

        setMsg("");
    };


    // ---------------------------------------------
    // Login
    // ---------------------------------------------

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMsg("");

        try {

            const response = await fetch(
                `${BASE}/api/token/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify(form),
                }
            );


            console.log(response.status);


            const data = await response.json();


            if (response.ok) {

                saveTokens(data);

                setMsg(
                    "تم تسجيل الدخول بنجاح! جاري التحويل..."
                );


                setTimeout(() => {

                    navigate("/ar-dashboard");

                }, 800);


            } else {

                setMsg(
                    data.detail ||
                    "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى."
                );

            }


        } catch (error) {

            console.error(error);

            setMsg(
                "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى."
            );

        }
    };


    return (

        <div
            dir="rtl"
            className="
                min-h-screen
                flex
                items-center
                justify-center
                md:justify-start
                lg:justify-start
                p-4 md:p-6
                md:px-60
                lg:px-100    
                bg-cover
                bg-center
                bg-no-repeat
            "
            style={{ backgroundImage: `url(${background})` }}
        >

            {/* Overlay for better readability */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Main Container - Full width form on right side */}
            <div className="
                relative 
                w-full 
                max-w-lg
                flex 
                flex-col
                rounded-2xl 
                overflow-hidden 
                shadow-2xl 
                bg-[#f8f7f5]
            ">

                {/* ============================================ */}
                {/* RIGHT SIDE - Login Form Section (Full Width) */}
                {/* ============================================ */}

                <div className="
                    w-full
                    bg-white
                    p-6 md:p-8 lg:p-10
                    flex flex-col justify-center
                ">

                    {/* Logo Section */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className='flex flex-col justify-center md:flex md:flex-row md:justify-between items-center'>
                            <img
                            src={logo}
                            alt="Logo"
                            className="
                                w-16 h-16 md:w-20 md:h-20
                                object-contain
                                rounded-lg
                                mb-3
                            "
                        />

                        <h1 className="
                            text-2xl md:text-3xl
                            font-bold
                            text-[#a47d52]
                            font-extrabold
                            mb-1
                        ">
                            بروكر سيتي العقاريه
                        </h1>

                        </div>
                        

                        <div className="w-12 h-1 bg-[#a47d52] rounded-full mb-2 md:hidden"></div>

                   
<div 
    className="flex flex-row items-center justify-start gap-2 px-2 py-1 rounded-md hover:bg-[#e9e6e1] transition-colors cursor-pointer"
    onClick={() => navigate('/login')}
>
    <FaLanguage className="text-green-600 w-4 h-4" />
    <p className="text-[#8a7e6f] text-sm font-medium m-0 p-0">
        EN
    </p>
</div>
                        

                        <p className="text-[#8a7e6f] text-sm text-center">
                            مرحبا بك في منصتك العقارية المتكاملة
                        </p>

                        <p className="text-[#8a7e6f] text-xs text-center mt-1 opacity-70">
                            سجل الدخول للوصول إلى لوحة التحكم
                        </p>
                    </div>

                    {/* -------------------------------- */}
                    {/* Quick Login Buttons */}
                    {/* -------------------------------- */}

                    {!loginMode && (

                        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">

                            {/* Owner / Manager */}

                            <button
                                type="button"
                                onClick={() =>
                                    handleUserLogin("manager")
                                }
                                className="
                                    w-full
                                    bg-[#a47d52]
                                    py-3
                                    px-4
                                    rounded-sm
                                    transition
                                    duration-200
                                    cursor-pointer
                                    shadow-lg
                                    hover:shadow-xl
                                    hover:opacity-90
                                "
                            >
                                <span className='font-extrabold text-sm text-white'>السيد</span>
                                <span className='text-xs text-white'>/ </span>
                                <span className='font-extrabold text-lg text-white'>المدير العام</span>
                            </button>

                            {/* Ghada */}

                            <button
                                type="button"
                                onClick={() =>
                                    handleUserLogin("ghada")
                                }
                                className="
                                    w-full
                                    bg-[#a47d52]
                                    py-3
                                    px-4
                                    rounded-sm
                                    transition
                                    duration-200
                                    cursor-pointer
                                    shadow-lg
                                    hover:shadow-xl
                                    hover:opacity-90
                                "
                            >
                                <span className='font-extrabold text-sm text-white'>استاذه</span>
                                <span className='text-xs text-white'>/ </span>
                                <span className='font-extrabold text-lg text-white'>غادة</span>
                            </button>

                        </div>

                    )}


                    {/* -------------------------------- */}
                    {/* Selected User Header */}
                    {/* -------------------------------- */}

                    {loginMode && (

                        <div
                            className="
                                mb-5
                                rounded-lg
                                bg-[#e9e6e1]
                                border
                                border-[#d5d1ca]
                                px-4
                                py-3
                                text-center
                            "
                        >

                            <p className="text-sm text-[#73765a] font-medium">

                                {loginMode === "manager"
                                    ? "تسجيل دخول المدير العام"
                                    : "تسجيل دخول استاذة / غادة"}

                            </p>

                            <p className="text-xs text-[#8a7e6f] mt-1">
                                المستخدم: {loginMode}
                            </p>

                        </div>

                    )}


                    {/* -------------------------------- */}
                    {/* Login Form */}
                    {/* -------------------------------- */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        {/* Username */}

                        {!loginMode && (

                            <div>

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-medium
                                        text-[#8a7e6f]
                                        mb-1.5
                                    "
                                >
                                    اسم المستخدم
                                </label>

                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="أدخل اسم المستخدم"
                                    required
                                    style={{ backgroundColor: '#f8f7f5' }}  //inline style
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        
                                        border-[#e9e6e1]
                                        px-4
                                        py-3
                                        outline-none
                                        focus:ring-2
                                        focus:ring-[#a47d52]
                                        focus:border-[#a47d52]
                                        text-[#4a4a4a]
                                        placeholder:text-[#8a7e6f]
                                        transition
                                    "
                                />

                            </div>

                        )}


                        {/* Password */}

                        <div>

                            <label
                                className="
                                    block
                                    text-sm
                                    font-medium
                                    text-[#8a7e6f]
                                    mb-1.5
                                "
                            >
                                كلمة المرور
                            </label>

                            <div className="relative">

                                <input
                                    ref={passwordRef}
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="أدخل كلمة المرور"
                                    required
                                    style={{ backgroundColor: '#f8f7f5' }}  // Tailwind red-500 equivalent
                                    className="
                                        w-full
                                        rounded-lg
                                       
                                        border
                                        border-[#e9e6e1]
                                        px-4
                                        py-3
                                        pl-12
                                        outline-none
                                        focus:ring-2
                                        focus:ring-[#a47d52]
                                        focus:border-[#a47d52]
                                        transition
                                        text-[#4a4a4a]
                                        placeholder:text-[#8a7e6f]
                                    "
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="
                                        absolute
                                        left-3
                                        top-1/2
                                        -translate-y-1/2
                                        text-[#8a7e6f]
                                        hover:text-[#a47d52]
                                        cursor-pointer
                                        transition
                                    "
                                    aria-label={
                                        showPassword
                                            ? "إخفاء كلمة المرور"
                                            : "إظهار كلمة المرور"
                                    }
                                >

                                    {showPassword ? (
                                        <FaEyeSlash size={18} />
                                    ) : (
                                        <FaEye size={18} />
                                    )}

                                </button>

                            </div>

                        </div>


                        {/* Login Button */}

                        <button
                            type="submit"
                            className="
                                w-full
                                bg-[#a47d52]
                                hover:bg-[#8a6a44]
                                text-white
                                font-extrabold
                                py-3
                                rounded-lg
                                transition
                                duration-200
                                cursor-pointer
                                shadow-md
                                hover:shadow-lg
                            "
                        >
                            تسجيل الدخول
                        </button>

                    </form>


                    {/* -------------------------------- */}
                    {/* Back to Normal Login */}
                    {/* -------------------------------- */}

                    {loginMode && (

                        <button
                            type="button"
                            onClick={handleNormalLogin}
                            className="
                                w-full
                                mt-4
                                text-md
                                text-[#a47d52]
                                hover:text-[#8a6a44]
                                transition
                                cursor-pointer
                                font-extrabold
                            "
                        >
                            العودة إلى تسجيل الدخول العادي
                        </button>

                    )}


                    {/* -------------------------------- */}
                    {/* Message */}
                    {/* -------------------------------- */}

                    {msg && (

                        <div
                            className="
                                mt-4
                                rounded-lg
                                bg-[#e9e6e1]
                                border
                                border-[#d5d1ca]
                                px-4
                                py-3
                            "
                        >

                            <p
                                className="
                                    text-sm
                                    text-[#73765a]
                                    text-center
                                "
                            >
                                {msg}
                            </p>

                        </div>

                    )}


                    {/* -------------------------------- */}
                    {/* Signup */}
                    {/* -------------------------------- */}

                    {!loginMode && (

                        <div
                            className="
                                mt-6
                                text-center
                                text-sm
                            "
                        >
                            <span className="text-[#8a7e6f]">
                                ليس لديك حساب؟
                            </span>

                            <a
                                href="/#"
                                className="
                                    mr-2
                                    font-semibold
                                    text-[#a47d52]
                                    underline
                                    hover:text-[#8a6a44]
                                    transition
                                "
                            >
                                إنشاء حساب جديد
                            </a>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Login;

