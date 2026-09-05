import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveTokens } from "../../utils/auth";
import logo from '../../assets/images/logo.png';
import background from "../../assets/images/background.jpg";
import { FaEye, FaEyeSlash, FaBuilding, FaShieldAlt, FaUserTie, FaBalanceScale, FaChartLine, FaUsers, FaTasks } from "react-icons/fa";
import { FaLanguage } from "react-icons/fa6";
import { IoMegaphoneOutline, IoShield, IoSparkles, IoBusiness, IoPeople } from 'react-icons/io5';
import { LuUsers } from 'react-icons/lu';
import { GiCrown } from 'react-icons/gi';
import { MdOutlineRealEstateAgent } from 'react-icons/md';

function Login() {
    const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [loginMode, setLoginMode] = useState(null);
    const [msg, setMsg] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const passwordRef = useRef(null);

    // ------------------------------------------------
    // Auto-login timer
    // ------------------------------------------------
    const loginTimeoutRef = useRef(null);

    // ------------------------------------------------
    // Keep the latest login state available to the
    // auto-login effect without creating a new timer
    // on every state update.
    // ------------------------------------------------
    const isLoggingInRef = useRef(false);

    useEffect(() => {
        isLoggingInRef.current = isLoggingIn;
    }, [isLoggingIn]);

    // ---------------------------------------------
    // Auto-login when password is entered
    // ---------------------------------------------

    useEffect(() => {

        // Clear previous timer
        if (loginTimeoutRef.current) {
            clearTimeout(loginTimeoutRef.current);
            loginTimeoutRef.current = null;
        }

        // Auto-login is intended for Quick Login users.
        // Normal login remains manual through the Sign In button.
        if (
            loginMode &&
            form.username &&
            form.password &&
            form.password.length >= 4 &&
            !isLoggingIn
        ) {
            // Small delay after the user finishes typing.
            loginTimeoutRef.current = setTimeout(() => {

                // Prevent duplicate login requests.
                if (!isLoggingInRef.current) {
                    handleSubmit();
                }

            }, 800);
        }

        // Cleanup timer whenever dependencies change.
        return () => {
            if (loginTimeoutRef.current) {
                clearTimeout(loginTimeoutRef.current);
                loginTimeoutRef.current = null;
            }
        };

    }, [
        form.password,
        form.username,
        loginMode,
        isLoggingIn
    ]);

    // ---------------------------------------------
    // Handle input changes
    // ---------------------------------------------

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

        // Clear message when user starts typing
        if (msg) {
            setMsg("");
        }
    };

    // ---------------------------------------------
    // Select User Login
    // ---------------------------------------------

    const handleUserLogin = (username) => {

        // Cancel any previous auto-login timer
        if (loginTimeoutRef.current) {
            clearTimeout(loginTimeoutRef.current);
            loginTimeoutRef.current = null;
        }

        setLoginMode(username);

        setForm({
            username: username,
            password: "",
        });

        setMsg("");
        setIsLoggingIn(false);

        // Focus password input automatically
        setTimeout(() => {
            passwordRef.current?.focus();
        }, 100);
    };

    // ---------------------------------------------
    // Return to normal login
    // ---------------------------------------------

    const handleNormalLogin = () => {

        // Cancel auto-login timer
        if (loginTimeoutRef.current) {
            clearTimeout(loginTimeoutRef.current);
            loginTimeoutRef.current = null;
        }

        setLoginMode(null);

        setForm({
            username: "",
            password: "",
        });

        setMsg("");
        setIsLoggingIn(false);
    };

    // ---------------------------------------------
    // Login
    // ---------------------------------------------

    const handleSubmit = async (e) => {

        // The function can be called from:
        // 1. Normal form submit
        // 2. Auto-login timer
        if (e?.preventDefault) {
            e.preventDefault();
        }

        // Prevent multiple login attempts
        if (isLoggingInRef.current) {
            return;
        }

        // Validate password length
        if (form.password.length < 4) {
            setMsg("Password must be at least 4 characters");

            passwordRef.current?.focus();

            return;
        }

        setMsg("");

        // Set both state and ref immediately.
        // The ref prevents another auto-login request
        // before React finishes updating the state.
        isLoggingInRef.current = true;
        setIsLoggingIn(true);

        try {

            // -----------------------------------------
            // Request JWT tokens
            // -----------------------------------------

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

            // Safely read JSON response
            let data = {};

            try {
                data = await response.json();
            } catch (jsonError) {
                console.error(
                    "Failed to parse login response:",
                    jsonError
                );
            }

            console.log(
                "Login response status:",
                response.status
            );

            // -----------------------------------------
            // Successful login
            // -----------------------------------------

            if (response.ok) {

                // Django SimpleJWT returns:
                //
                // {
                //     access: "...",
                //     refresh: "..."
                // }
                //
                // Save both tokens using the existing
                // authentication utility.
                saveTokens(data);

                // Confirm that the access token was actually
                // stored before continuing.
                const savedAccessToken =
                    localStorage.getItem("access_token");

                const savedRefreshToken =
                    localStorage.getItem("refresh_token");

                if (!savedAccessToken || !savedRefreshToken) {

                    console.error(
                        "Tokens were returned but were not saved."
                    );

                    setMsg(
                        "⚠️ Login succeeded but tokens could not be saved."
                    );

                    isLoggingInRef.current = false;
                    setIsLoggingIn(false);

                    return;
                }

                console.log(
                    "JWT tokens saved successfully."
                );

                setMsg(
                    "✅ Login successful! Redirecting..."
                );

                // -----------------------------------------
                // Important:
                //
                // Do NOT call /api/me/ here.
                //
                // Navbar.jsx will fetch /api/me/ after the
                // dashboard loads using authFetch().
                // -----------------------------------------

                setTimeout(() => {
                    navigate("/ar-dashboard");
                }, 600);

            } else {

                // -----------------------------------------
                // Login failed
                // -----------------------------------------

                setMsg(
                    data.detail ||
                    "❌ Login failed. Please try again."
                );

                isLoggingInRef.current = false;
                setIsLoggingIn(false);

                // Focus password field on error
                passwordRef.current?.focus();
                passwordRef.current?.select();
            }

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            setMsg(
                "⚠️ An error occurred during login. Please try again."
            );

            isLoggingInRef.current = false;
            setIsLoggingIn(false);
        }
    };

    // ---------------------------------------------
    // Handle Enter key press
    // ---------------------------------------------

    const handleKeyDown = (e) => {

        if (
            e.key === "Enter" &&
            form.password &&
            !isLoggingIn
        ) {
            e.preventDefault();

            handleSubmit(e);
        }
    };

    // User role configurations with enhanced colors and icons
    const userRoles = {
        manager: {
            title: 'Director General',
            icon: IoShield,
            color: 'from-amber-300 to-amber-600',
            bgColor: 'bg-amber-500/20',
            borderColor: 'border-amber-400/30',
            badgeColor: 'bg-amber-500/30 text-amber-200',
            glowColor: 'shadow-amber-500/30',
            gradient: 'from-amber-400/20 via-amber-500/10 to-transparent',
            emoji: '👑',
            subtitle: 'Top Leadership'
        },
        muhsin: {
            title: 'Admin Manager',
            icon: FaUserTie,
            color: 'from-blue-200 to-blue-600',
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-400/30',
            badgeColor: 'bg-blue-500/30 text-blue-200',
            glowColor: 'shadow-blue-500/30',
            gradient: 'from-blue-400/20 via-blue-500/10 to-transparent',
            emoji: '📋',
            subtitle: 'Operations Management'
        },
        ghada: {
            title: 'Personnel Manager',
            icon: FaUsers,
            color: 'from-emerald-300 to-emerald-600',
            bgColor: 'bg-emerald-500/20',
            borderColor: 'border-emerald-400/30',
            badgeColor: 'bg-emerald-500/30 text-emerald-200',
            glowColor: 'shadow-emerald-500/30',
            gradient: 'from-emerald-400/20 via-emerald-500/10 to-transparent',
            emoji: '👥',
            subtitle: 'Human Resources'
        },
        muhammed: {
            title: 'Marketing Manager',
            icon: FaChartLine,
            color: 'from-purple-300 to-purple-600',
            bgColor: 'bg-purple-500/20',
            borderColor: 'border-purple-400/30',
            badgeColor: 'bg-purple-500/30 text-purple-200',
            glowColor: 'shadow-purple-500/30',
            gradient: 'from-purple-400/20 via-purple-500/10 to-transparent',
            emoji: '📈',
            subtitle: 'Marketing Strategy'
        },
        abubakr: {
            title: 'Legal Counsel',
            icon: FaBalanceScale,
            color: 'from-rose-300 to-rose-600',
            bgColor: 'bg-rose-500/20',
            borderColor: 'border-rose-400/30',
            badgeColor: 'bg-rose-500/30 text-rose-200',
            glowColor: 'shadow-rose-500/30',
            gradient: 'from-rose-400/20 via-rose-500/10 to-transparent',
            emoji: '⚖️',
            subtitle: 'Legal Affairs'
        }
    };

    // Floating particles for background
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.3 + 0.1,
    }));

    return (
        <div
            dir="ltr"
            className="
                
                min-h-screen
                flex
                items-center
                justify-center
                p-4
                md:p-10
                lg:p-16
                
                bg-cover
                bg-center
                bg-no-repeat
                relative
                overflow-hidden
            "
            style={{ backgroundImage: `url(${background})` }}
        >
            {/* Animated Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/20 to-black/70"></div>

            {/* Animated Background Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute rounded-full bg-white/20"
                        style={{
                            width: p.size,
                            height: p.size,
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                            opacity: p.opacity,
                        }}
                    />
                ))}
            </div>

            {/* Decorative Orbs with Animation */}
            <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow delay-1500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow delay-750"></div>

            {/* Floating Decorative Elements */}
            <div className="absolute top-1/4 right-1/4 animate-float-slow opacity-20 text-8xl">
                💎
            </div>
            <div className="absolute bottom-1/4 right-1/4 animate-float-slow-delay opacity-20 text-8xl">
                ✨
            </div>

            {/* ============================================ */}
            {/* Content row: login card (left) + info panel (right) */}
            {/* ============================================ */}
            <div
                className="
                    relative
                    z-10
                    w-full
                    max-w-6xl
                    flex
                    flex-col
                    lg:flex-row
                    items-center
                    justify-between
                    gap-10
                    lg:gap-16
                "
            >
                {/* ============================================ */}
                {/* LEFT SIDE — Login Form (premium/auto-login) */}
                {/* ============================================ */}
                <div className="
                    relative 
                    w-full 
                    max-w-lg
                    flex 
                    flex-col
                    rounded-3xl 
                    overflow-hidden 
                    shadow-[0_30px_80px_rgba(0,0,0,0.5)]
                    bg-gradient-to-br from-[#f8f7f5] to-white
                    backdrop-blur-sm
                    border
                    border-white/10
                    transform
                    transition-all
                    duration-500
                    hover:shadow-[0_40px_100px_rgba(164,125,82,0.2)]
                    animate-scale-in
                ">
                    {/* Premium Top Bar with Animation */}
                    <div className="h-1.5 bg-gradient-to-r from-[#a47d52] via-[#c4a37a] to-[#a47d52] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>

                    <div className="
                        w-full
                        bg-white/95
                        backdrop-blur-md
                        p-6 md:p-8 lg:p-10
                        flex flex-col justify-center
                        relative
                    ">
                        {/* Decorative Corner Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden opacity-5">
                            <div className="w-full h-full bg-gradient-to-br from-[#a47d52] to-transparent transform rotate-45 translate-x-8 -translate-y-8"></div>
                        </div>

                        <div className="absolute bottom-0 left-0 w-32 h-32 overflow-hidden opacity-5">
                            <div className="w-full h-full bg-gradient-to-tl from-[#a47d52] to-transparent transform rotate-45 -translate-x-8 translate-y-8"></div>
                        </div>

                        {/* Logo Section with Enhanced Animation */}
                        <div className="flex flex-col items-center justify-center mb-8 relative">
                            <div className='flex flex-col justify-center md:flex md:flex-row md:justify-between items-center w-full'>
                                <div className="relative group">
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        className="
                                            w-20 h-20 md:w-24 md:h-24
                                            object-contain
                                            rounded-2xl
                                            mb-3 md:mb-0
                                            mr-10
                                            relative
                                            z-10
                                            shadow-2xl
                                            group-hover:ring-[#a47d52]/40
                                            transition-all
                                            duration-500
                                            group-hover:scale-105
                                        "
                                    />
                                </div>

                                <div className="text-center md:text-left relative">
                                    <h1 className="
                                        text-2xl md:text-4xl
                                        font-bold
                                        bg-gradient-to-r from-[#a47d52] via-[#c4a37a] to-[#a47d52]
                                        bg-clip-text
                                        text-transparent
                                        font-extrabold
                                        mb-1
                                        animate-gradient-x
                                    ">
                                        Broker City Properties
                                    </h1>

                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <div className="w-16 h-0.5 bg-gradient-to-r from-[#a47d52] to-[#c4a37a]"></div>
                                        <MdOutlineRealEstateAgent className="text-[#a47d52] text-lg" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <span
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"
                                                style={{ animationDelay: `${i * 0.3}s` }}
                                            ></span>
                                        ))}
                                    </div>

                                    <p className="text-[#8a7e6f] text-sm font-light">
                                        Integrated Real Estate Platform
                                    </p>
                                </div>

                                <div
                                    className="
                                        flex flex-row items-center gap-2 
                                        px-4 py-2 
                                        rounded-full 
                                        bg-gradient-to-r from-[#f8f7f5] to-[#e9e6e1]
                                        hover:from-[#e9e6e1] hover:to-[#ddd8d0]
                                        transition-all 
                                        duration-500 
                                        cursor-pointer 
                                        border border-[#e9e6e1] 
                                        hover:border-[#a47d52]/40
                                        hover:shadow-lg
                                        hover:scale-105
                                        group
                                        relative
                                        overflow-hidden
                                    "
                                    onClick={() => navigate('/ar-login')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#a47d52]/0 via-[#a47d52]/5 to-[#a47d52]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                                    <FaLanguage className="text-[#a47d52] w-4 h-4 relative z-10" />

                                    <p className="text-[#8a7e6f] text-sm font-medium m-0 p-0 relative z-10">
                                        AR
                                    </p>

                                    <span className="text-[#a47d52] text-xs relative z-10">
                                        ←
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------- */}
                        {/* Quick Login Buttons with Premium Design */}
                        {/* -------------------------------- */}
                        {!loginMode && (
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#a47d52]/30"></div>

                                    <div className="flex items-center gap-2">
                                        <IoSparkles className="text-[#a47d52] text-sm" />
                                        <span className="text-xs text-[#8a7e6f] font-medium tracking-wider">
                                            Quick Login
                                        </span>
                                        <IoSparkles className="text-[#a47d52] text-sm" />
                                    </div>

                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#a47d52]/30"></div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* Director General - Premium Card */}
                                    <button
                                        type="button"
                                        onClick={() => handleUserLogin("manager")}
                                        className="
                                            relative
                                            w-full
                                            h-16
                                            bg-gradient-to-r from-[#a47d52] via-[#b8926a] to-[#a47d52]
                                            bg-[length:200%_100%]
                                            hover:bg-[length:100%_100%]
                                            py-3
                                            px-4
                                            rounded-2xl
                                            transition-all
                                            duration-500
                                            cursor-pointer
                                            shadow-lg
                                            hover:shadow-2xl
                                            hover:scale-[1.02]
                                            group
                                            overflow-hidden
                                            border
                                            border-white/20
                                            animate-gradient-x
                                        "
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        <div className="absolute -inset-1 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        <div className='flex items-center gap-2 justify-between relative z-10'>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm animate-pulse"></div>
                                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                                                        <GiCrown className='text-white text-xl animate-pulse' />
                                                    </div>
                                                </div>

                                                <div className="text-left">
                                                    <span className='font-bold text-base text-white block'>
                                                        Director General
                                                    </span>
                                                    <span className='text-[10px] text-white/70'>
                                                        Top Leadership
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold text-white border border-white/30 backdrop-blur-sm">
                                                    👑 CEO
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Other buttons - Enhanced Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(userRoles)
                                            .filter(([key]) => key !== 'manager')
                                            .map(([key, role]) => {
                                                const Icon = role.icon;

                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => handleUserLogin(key)}
                                                        className={`
                                                            relative
                                                            w-full
                                                            h-16
                                                            bg-gradient-to-r ${role.color}
                                                            bg-[length:200%_100%]
                                                            hover:bg-[length:100%_100%]
                                                            py-1
                                                            px-4
                                                            rounded-2xl
                                                            transition-all
                                                            duration-500
                                                            cursor-pointer
                                                            shadow-lg
                                                            hover:shadow-2xl
                                                            hover:scale-[1.02]
                                                            group
                                                            overflow-hidden
                                                            border ${role.borderColor}
                                                            backdrop-blur-sm
                                                            bg-white/5
                                                            animate-gradient-x
                                                        `}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                                        <div className={`absolute -inset-1 ${role.glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                                                        <div className='flex items-center gap-2 justify-between relative z-10'>
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-10 h-10 rounded-full ${role.badgeColor} flex items-center justify-center backdrop-blur-sm`}>
                                                                    <Icon className='text-white text-lg' />
                                                                </div>

                                                                <div className="text-left flex flex-col gap-0">
                                                                    <span className='font-bold text-sm text-white block'>
                                                                        {role.title}
                                                                    </span>
                                                                    <span className='text-[10px] text-white/70'>
                                                                        {role.subtitle}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-white text-lg">
                                                                {role.emoji}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* -------------------------------- */}
                        {/* Selected User Header - Premium */}
                        {/* -------------------------------- */}
                        {loginMode && (
                            <div
                                className="
                                    mb-5
                                    rounded-2xl
                                    bg-gradient-to-r from-[#e9e6e1] via-[#f5f3ef] to-[#e9e6e1]
                                    border
                                    border-[#d5d1ca]
                                    px-5
                                    py-4
                                    text-center
                                    relative
                                    overflow-hidden
                                    shadow-inner
                                "
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#a47d52]/5 via-transparent to-[#a47d52]/5"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a47d52]/5 to-transparent animate-shimmer"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                                            <span className="text-xs text-[#8a7e6f]">
                                                User:
                                            </span>
                                        </div>

                                        <span className="text-sm font-bold text-[#a47d52]">
                                            {loginMode}
                                        </span>

                                        <div className="w-px h-4 bg-[#d5d1ca]"></div>

                                        <div className="flex items-center gap-1">
                                            <IoSparkles className="text-[#a47d52] text-xs" />
                                            <span className="text-[10px] text-[#a47d52]/60">
                                                Online
                                            </span>
                                        </div>
                                    </div>

                                    {isLoggingIn && (
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                            <svg
                                                className="animate-spin h-3 w-3 text-[#a47d52]"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            <p className="text-xs text-[#a47d52] font-medium">
                                                Logging in...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* -------------------------------- */}
                        {/* Login Form - Enhanced */}
                        {/* -------------------------------- */}
                        <form onSubmit={handleSubmit} className="space-y-5 sm:mt-10">
                            {/* Username */}
                            {!loginMode && (
                                <div>
                                    <label className="block text-sm font-medium text-[#8a7e6f] mb-1.5">
                                        <span className="flex items-center gap-2">
                                            <FaBuilding className="text-[#a47d52] text-xs" />
                                            Username
                                        </span>
                                    </label>

                                    <div className="relative group">
                                        <input
                                            name="username"
                                            value={form.username}
                                            onChange={handleChange}
                                            placeholder="Enter your username"
                                            required
                                            className="
                                                w-full
                                                rounded-2xl
                                                border-2
                                                border-[#e9e6e1]
                                                bg-[#f8f7f5]
                                                px-4
                                                py-3.5
                                                pr-12
                                                outline-none
                                                focus:ring-4
                                                focus:ring-[#a47d52]/20
                                                focus:border-[#a47d52]
                                                text-[#4a4a4a]
                                                placeholder:text-[#8a7e6f]/50
                                                transition-all
                                                duration-300
                                                group-hover:border-[#a47d52]/30
                                            "
                                        />

                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7e6f]/40 group-focus-within:text-[#a47d52] transition-colors duration-300">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Password - Enhanced */}
                            <div>
                                <label className="block text-sm font-medium text-[#8a7e6f] mb-1.5">
                                    <span className="flex items-center gap-2">
                                        <FaShieldAlt className="text-[#a47d52] text-xs" />
                                        Password
                                        {loginMode && (
                                            <span className="text-xs text-[#a47d52] ml-2 font-normal bg-[#a47d52]/10 px-2 py-0.5 rounded-full">
                                                Auto-login
                                            </span>
                                        )}
                                    </span>
                                </label>

                                <div className="relative group">
                                    <input
                                        ref={passwordRef}
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder="Enter your password"
                                        required
                                        disabled={isLoggingIn}
                                        className={`
                                            w-full
                                            rounded-2xl
                                            border-2
                                            ${form.password.length >= 4 && !isLoggingIn
                                                ? 'border-emerald-400/50 bg-emerald-50/30'
                                                : form.password.length > 0 && form.password.length < 4
                                                ? 'border-yellow-400/50 bg-yellow-50/30'
                                                : 'border-[#e9e6e1] bg-[#f8f7f5]'}
                                            px-4
                                            py-3.5
                                            pr-12
                                            outline-none
                                            focus:ring-4
                                            focus:ring-[#a47d52]/20
                                            focus:border-[#a47d52]
                                            transition-all
                                            duration-300
                                            text-[#4a4a4a]
                                            placeholder:text-[#8a7e6f]/50
                                            disabled:opacity-60
                                            disabled:cursor-not-allowed
                                            group-hover:border-[#a47d52]/30
                                        `}
                                    />

                                    {form.password.length > 0 && (
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <div className={`
                                                w-2.5 h-2.5 rounded-full 
                                                ${form.password.length >= 4
                                                    ? 'bg-emerald-400 animate-pulse'
                                                    : 'bg-yellow-400'}
                                            `}></div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-[#8a7e6f]
                                            hover:text-[#a47d52]
                                            cursor-pointer
                                            transition-all
                                            duration-300
                                            p-2
                                            rounded-xl
                                            hover:bg-[#f8f7f5]
                                            hover:scale-110
                                        "
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        disabled={isLoggingIn}
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash size={18} />
                                        ) : (
                                            <FaEye size={18} />
                                        )}
                                    </button>

                                    {isFocused && (
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#a47d52]/20 to-[#c4a37a]/20 rounded-2xl blur-sm -z-10 animate-pulse"></div>
                                    )}
                                </div>

                                {loginMode && form.password.length === 0 && (
                                    <p className="text-xs text-[#8a7e6f]/60 mt-2 flex items-center gap-1.5">
                                        <span className="text-lg">🔑</span>
                                        Enter password for auto-login
                                    </p>
                                )}

                                {loginMode && form.password.length > 0 && form.password.length < 4 && (
                                    <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1.5">
                                        <span className="text-lg">⚠️</span>
                                        Password too short (min 4 characters)
                                    </p>
                                )}

                                {loginMode && form.password.length >= 4 && (
                                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5 animate-pulse">
                                        <span className="text-lg">✅</span>
                                        Password ready - auto-login enabled
                                    </p>
                                )}
                            </div>
                            {/* -------------------------------- */}
                            {/* Sign In — hidden button + enhanced status */}
                            {/* -------------------------------- */}

                            {/* Visually hidden submit button.
    Kept in the DOM (not display:none) so native form
    submission / screen readers / keyboard Enter still work,
    but nothing is shown visually — auto-login + Enter key
    handle everything for the user. */}
                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="sr-only"
                                aria-hidden="true"
                                tabIndex={-1}
                            >
                                Sign In
                            </button>

                            {/* Enhanced loading state — replaces the old button UI */}
                            {isLoggingIn && (
                                <div
                                    className="
            relative
            mt-2
            w-full
            rounded-2xl
            overflow-hidden
            bg-gradient-to-r from-[#a47d52]/10 via-[#c4a37a]/10 to-[#a47d52]/10
            border
            border-[#a47d52]/20
            px-5
            py-4
            animate-slide-down
        "
                                >
                                    {/* Shimmer sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>

                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        <div className="relative">
                                            <div className="absolute -inset-1.5 bg-[#a47d52]/30 rounded-full blur-md animate-pulse"></div>
                                            <svg
                                                className="relative animate-spin h-6 w-6 text-[#a47d52]"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#a47d52]">
                                                Verifying credentials...
                                            </span>
                                            <span className="text-[10px] text-[#8a7e6f]">
                                                Please wait a moment
                                            </span>
                                        </div>

                                        <div className="flex gap-1 ml-1">
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-[#a47d52] animate-pulse"
                                                    style={{ animationDelay: `${i * 0.2}s` }}
                                                ></span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Login Button - Premium */}
                            {/* <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="
                                    relative
                                    w-full
                                    bg-gradient-to-r from-[#a47d52] via-[#c4a37a] to-[#a47d52]
                                    bg-[length:200%_100%]
                                    hover:bg-[length:100%_100%]
                                    text-white
                                    font-extrabold
                                    py-4
                                    rounded-2xl
                                    transition-all
                                    duration-500
                                    cursor-pointer
                                    shadow-lg
                                    hover:shadow-2xl
                                    hover:scale-[1.02]
                                    disabled:opacity-70
                                    disabled:cursor-not-allowed
                                    disabled:hover:scale-100
                                    overflow-hidden
                                    group
                                    animate-gradient-x
                                "
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {isLoggingIn ? (
                                    <span className="flex items-center justify-center gap-3 relative z-10">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <span>Sign In</span>
                                        <span className="text-lg">→</span>
                                    </span>
                                )}
                            </button> */}
                        </form>

                        {/* -------------------------------- */}
                        {/* Back to Normal Login */}
                        {/* -------------------------------- */}
                        {loginMode && (
                            <button
                                type="button"
                                onClick={handleNormalLogin}
                                disabled={isLoggingIn}
                                className="
                                    w-full
                                    mt-4
                                    text-sm
                                    text-[#a47d52]
                                    hover:text-[#8a6a44]
                                    transition-all
                                    duration-300
                                    cursor-pointer
                                    font-medium
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                    py-2.5
                                    rounded-xl
                                    hover:bg-[#f8f7f5]
                                    hover:scale-[1.02]
                                    flex items-center justify-center gap-2
                                "
                            >
                                <span>←</span>
                                Back to normal login
                            </button>
                        )}

                        {/* -------------------------------- */}
                        {/* Message - Enhanced */}
                        {/* -------------------------------- */}
                        {msg && (
                            <div
                                className={`
                                    mt-4
                                    rounded-2xl
                                    px-5
                                    py-3.5
                                    text-center
                                    border-2
                                    animate-slide-down
                                    ${msg.includes('✅')
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-amber-50 border-amber-200 text-amber-700'}
                                    flex items-center gap-2 justify-center
                                `}
                            >
                                <p className="text-sm font-medium">
                                    {msg}
                                </p>
                            </div>
                        )}

                        {/* -------------------------------- */}
                        {/* Signup - Enhanced */}
                        {/* -------------------------------- */}
                        {!loginMode && (
                            <div className="mt-6 text-center text-sm">
                                <span className="text-[#8a7e6f]">
                                    Don't have an account?
                                </span>

                                <a
                                    href=""
                                    className="
                                        ml-2
                                        font-semibold
                                        text-[#a47d52]
                                        hover:text-[#8a6a44]
                                        transition-all
                                        duration-300
                                        underline-offset-4
                                        hover:underline
                                        hover:scale-105
                                        inline-block
                                    "
                                >
                                    Create new account
                                    <span className="ml-1">✨</span>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Premium Bottom Bar */}
                    <div className="h-1.5 bg-gradient-to-r from-[#a47d52] via-[#c4a37a] to-[#a47d52] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                </div>

                {/* ============================================ */}
                {/* RIGHT SIDE — INFORMATION PANEL (unchanged) */}
                {/* ============================================ */}
                <div
                    dir="rtl"
                    className="hidden lg:flex flex-col items-center justify-center text-white px-8"
                    style={{ animation: "fadeInUp 0.8s ease-out both", animationDelay: "150ms" }}
                >
                    <img
                        src={logo}
                        alt="Broker City"
                        className="
                            w-48 h-auto mb-8 drop-shadow-2xl
                            transition-transform duration-500
                            hover:scale-105
                        "
                    />

                    <h1 className="text-4xl font-bold text-center mb-4">
                        Broker City Properties
                    </h1>

                    <p className="text-xl text-center text-white/90 leading-relaxed">
                        Your integrated digital real estate platform
                    </p>

                    <div className="mt-10 grid grid-cols-3 gap-50 w-full max-w-md ml-30">
                        {[
                            { Icon: IoBusiness, label: "Real Estate" },
                            { Icon: IoPeople, label: "Leads" },
                            { Icon: FaTasks, label: "Management" },
                        ].map(({ Icon, label }, i) => (
                            <div
                                key={label}
                                style={{
                                    animation: "fadeInUp 0.6s ease-out both",
                                    animationDelay: `${300 + i * 120}ms`,
                                }}
                                className="
                                    bg-white/10 backdrop-blur-md rounded-xl p-10 w-45
                                    text-center border border-white/20
                                    transition-all duration-300
                                    hover:bg-white/20 hover:border-[#a47d52]/60
                                    hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(164,125,82,0.6)]
                                    cursor-default
                                "
                            >
                                <Icon className="text-3xl mx-auto mb-2 transition-transform duration-300 hover:scale-110" />
                                <span className="text-sm">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                <p className="text-white/20 text-xs tracking-wider">
                    © {new Date().getFullYear()} Broker City Properties
                </p>

                <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    25% { transform: translateY(-20px) translateX(10px); }
                    50% { transform: translateY(-10px) translateX(-10px); }
                    75% { transform: translateY(-30px) translateX(5px); }
                }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(5deg); }
                }

                @keyframes float-slow-delay {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(-5deg); }
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }

                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
                .animate-float-slow-delay { animation: float-slow-delay 25s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
                .animate-scale-in { animation: scale-in 0.6s ease-out; }
                .animate-slide-down { animation: slide-down 0.4s ease-out; }
                .animate-gradient-x { background-size: 200% 100%; animation: gradient-x 3s ease-in-out infinite; }
                .delay-1500 { animation-delay: 1.5s; }
                .delay-750 { animation-delay: 0.75s; }
            `}</style>
        </div>
    );
}

export default Login;



// import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { saveTokens } from "../../utils/auth";
// import logo from '../../assets/images/logo.png';
// import background from "../../assets/images/background.jpg";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import { FaLanguage } from "react-icons/fa6";
// import { GiInjustice } from "react-icons/gi";
// import { IoMegaphoneOutline } from 'react-icons/io5';
// import { LuUsers, LuUserCog, LuUserRound, LuUserCheck, LuBriefcase } from 'react-icons/lu';
// import { FaBalanceScale } from 'react-icons/fa' ;
// import { FaUserCog, FaBriefcase, FaBuilding, FaTasks, FaClipboardList, FaUserTie } from 'react-icons/fa';
// import { IoBusiness, IoPerson, IoPeople, IoStar, IoShield, IoBriefcase, IoRibbon } from 'react-icons/io5';

// function Login() {
//     const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

//     const [form, setForm] = useState({
//         username: "",
//         password: "",
//     });

//     const [loginMode, setLoginMode] = useState(null);
//     const [msg, setMsg] = useState("");
//     const navigate = useNavigate();

//     const [showPassword, setShowPassword] = useState(false);
//     const passwordRef = useRef(null);


//     // ---------------------------------------------
//     // Handle input changes
//     // ---------------------------------------------

//     const handleChange = (e) => {
//         setForm({
//             ...form,
//             [e.target.name]: e.target.value,
//         });
//     };


//     // ---------------------------------------------
//     // Select User Login
//     // ---------------------------------------------

//     const handleUserLogin = (username) => {

//         setLoginMode(username);

//         setForm({
//             username: username,
//             password: "",
//         });

//         setMsg("");

//         // Focus password input automatically
//         setTimeout(() => {
//             passwordRef.current?.focus();
//         }, 0);
//     };


//     // ---------------------------------------------
//     // Return to normal login
//     // ---------------------------------------------

//     const handleNormalLogin = () => {

//         setLoginMode(null);

//         setForm({
//             username: "",
//             password: "",
//         });

//         setMsg("");
//     };


//     // ---------------------------------------------
//     // Login
//     // ---------------------------------------------

//     const handleSubmit = async (e) => {

//         e.preventDefault();

//         setMsg("");

//         try {

//             const response = await fetch(
//                 `${BASE}/api/token/`,
//                 {
//                     method: "POST",

//                     headers: {
//                         "Content-Type": "application/json",
//                     },

//                     body: JSON.stringify(form),
//                 }
//             );


//             console.log(response.status);


//             const data = await response.json();


//             if (response.ok) {

//                 saveTokens(data);

//                 setMsg(
//                     "Login successful! Redirecting..."
//                 );


//                 setTimeout(() => {

//                     navigate("/ar-dashboard");

//                 }, 800);


//             } else {

//                 setMsg(
//                     data.detail ||
//                     "Login failed. Please try again."
//                 );

//             }


//         } catch (error) {

//             console.error(error);

//             setMsg(
//                 "An error occurred during login. Please try again."
//             );

//         }
//     };


//     return (

//         <div
//             dir="ltr"
//                 className="
//                 min-h-screen
//                 flex
//                 items-center
//                 justify-center
//                 md:justify-start
//                 lg:justify-start
//                 p-4 
//                 md:px-16
//                 lg:px-32
//                 xl:px-48
//                 2xl:px-64
//                 bg-cover
//                 bg-center
//                 bg-no-repeat
//     "
//             style={{ backgroundImage: `url(${background})` }}
//         >

//             {/* Overlay for better readability */}
//             <div className="absolute inset-0 bg-black/40"></div>

//             {/* Main Container - Full width form on right side */}
//             <div className="
//                 relative 
//                 w-full 
//                 max-w-lg
//                 flex 
//                 flex-col
//                 rounded-2xl 
//                 overflow-hidden 
//                 shadow-2xl 
//                 bg-[#f8f7f5]
//             ">

//                 {/* ============================================ */}
//                 {/* RIGHT SIDE - Login Form Section (Full Width) */}
//                 {/* ============================================ */}

//                 <div className="
//                     w-full
//                     bg-white
//                     p-6 md:p-8 lg:p-10
//                     flex flex-col justify-center
//                 ">

//                     {/* Logo Section */}
//                     <div className="flex flex-col items-center justify-center mb-6">
//                         <div className='flex flex-col justify-center md:flex md:flex-row md:justify-between items-center w-full'>
//                             <img
//                                 src={logo}
//                                 alt="Logo"
//                                 className="
//                                     w-16 h-16 md:w-20 md:h-20
//                                     object-contain
//                                     rounded-lg
//                                     mb-3 md:mb-0
//                                 "
//                             />

//                             <h1 className="
//                                 text-2xl md:text-3xl
//                                 font-bold
//                                 text-[#a47d52]
//                                 font-extrabold
//                                 mb-1 md:mb-0
//                             ">
//                                 Broker City Properties
//                             </h1>

//                         </div>
                        

//                         <div className="w-12 h-1 bg-[#a47d52] rounded-full mb-2 md:hidden"></div>

                       
//                         <div 
//                             className="flex flex-row items-center justify-start gap-2 px-2 py-1 rounded-md hover:bg-[#e9e6e1] transition-colors cursor-pointer"
//                             onClick={() => navigate('/ar-login')}
//                         >
//                             <FaLanguage className="text-green-600 w-4 h-4" />
//                             <p className="text-[#8a7e6f] text-sm font-medium m-0 p-0">
//                                 AR
//                             </p>
//                         </div>
                        

//                         <p className="text-[#8a7e6f] text-sm text-center">
//                             Welcome to your integrated real estate platform
//                         </p>

//                         <p className="text-[#8a7e6f] text-xs text-center mt-1 opacity-70">
//                             Sign in to access your dashboard
//                         </p>
//                     </div>

//                     {/* -------------------------------- */}
//                     {/* Quick Login Buttons */}
//                     {/* -------------------------------- */}

//                     {!loginMode && (

//                        <div className="mb-6 flex flex-col gap-3 shadow-lg bg-[#f8f7f5] p-2">
//   {/* Owner / Manager - Full width on md+ screens */}
//   <button
//     type="button"
//     onClick={() => handleUserLogin("manager")}
//     className="
//       w-full
//       h-15
//       bg-[#a47d52]
//       py-3
//       px-4
//       rounded-sm
//       transition
//       duration-200
//       cursor-pointer
//       shadow-lg
//       hover:shadow-xl
//       hover:opacity-90
//     "
//   >

//     <div className='flex items-center gap-2 justify-between'>
//         <span className='font-semibold text-sm text-white font-extrabold'>Director General</span>
//         <IoShield className='text-white text-xl flex-shrink-0' />
//     </div>
//   </button>

//   {/* Other buttons grid - 2 columns on md+ screens */}
//   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//     <button
//       type="button"
//       onClick={() => handleUserLogin("muhsin")}
//       className="
//         w-full
//         h-15
//         bg-[#a47d52]
//         py-3
//         px-4
//         rounded-sm
//         transition
//         duration-200
//         cursor-pointer
//         shadow-lg
//         hover:shadow-xl
//         hover:opacity-90
//       "
//     >
//         <div className='flex items-center gap-2 justify-between'>
//             <span className='font-semibold text-sm text-white font-extrabold'>Admin Manager</span>
//             <FaUserTie className='text-white text-xl flex-shrink-0' /> 
//         </div>
//     </button>

//     <button
//        type="button"
//        onClick={() => handleUserLogin("ghada")}
//        className="
//         w-full
//         h-15
//         bg-[#a47d52]
//         py-3
//         px-4
//         rounded-sm
//         transition
//         duration-200
//         cursor-pointer
//         shadow-lg
//         hover:shadow-xl
//         hover:opacity-90
//       "
//     >
//         <div className='flex items-center gap-2 justify-between'>
//             <span className='font-semibold text-sm text-white font-extrabold'>Personnel Manager</span>
//             <LuUsers className='text-white text-xl flex-shrink-0' />   
//         </div>
//     </button>

//     <button
//       type="button"
//       onClick={() => handleUserLogin("muhammed")}
//       className="
//         w-full
//         h-15
//         bg-[#a47d52]
//         py-3
//         px-4
//         rounded-sm
//         transition
//         duration-200
//         cursor-pointer
//         shadow-lg
//         hover:shadow-xl
//         hover:opacity-90
//       "
//     >
//         <div className='flex items-center gap-2 justify-between'>
//             <span className='font-semibold text-sm text-white font-extrabold'>marketing Manager</span>
//             <IoMegaphoneOutline className='text-white text-xl flex-shrink-0' />
//         </div>
//     </button>

//     <button
//       type="button"
//       onClick={() => handleUserLogin("abubakr")}
//       className="
//         w-full
//         h-15
//         bg-[#a47d52]
//         py-1
//         px-4
//         rounded-sm
//         transition
//         duration-200
//         cursor-pointer
//         shadow-lg
//         hover:shadow-xl
//         hover:opacity-90
//       "
//     >
//         <div className='flex items-center gap-2 justify-between'>
//             <span className='font-semibold text-sm text-white font-extrabold'>Legal Counsel</span>
//             <FaBalanceScale className='text-white text-xl flex-shrink-0' />
//         </div>
//     </button>
//   </div>
// </div>

//                     )}


//                     {/* -------------------------------- */}
//                     {/* Selected User Header */}
//                     {/* -------------------------------- */}

//                     {loginMode && (

//                         <div
//                             className="
//                                 mb-5
//                                 rounded-lg
//                                 bg-[#e9e6e1]
//                                 border
//                                 border-[#d5d1ca]
//                                 px-4
//                                 py-3
//                                 text-center
//                             "
//                         >

//                             {/* <p className="text-sm text-[#73765a] font-medium">

//                                 {loginMode === "manager"
//                                     ? "General Manager Login"
//                                     : "Ms. Ghada Login"}

//                             </p> */}

//                             <p className="text-xs text-[#8a7e6f] mt-1">
//                                 User: {loginMode}
//                             </p>

//                         </div>

//                     )}


//                     {/* -------------------------------- */}
//                     {/* Login Form */}
//                     {/* -------------------------------- */}

//                     <form
//                         onSubmit={handleSubmit}
//                         className="space-y-4"
//                     >

//                         {/* Username */}

//                         {!loginMode && (

//                             <div>

//                                 <label
//                                     className="
//                                         block
//                                         text-sm
//                                         font-medium
//                                         text-[#8a7e6f]
//                                         mb-1.5
//                                     "
//                                 >
//                                     Username
//                                 </label>

//                                 <input
//                                     name="username"
//                                     value={form.username}
//                                     onChange={handleChange}
//                                     placeholder="Enter your username"
//                                     required
//                                     style={{ backgroundColor: '#f8f7f5' }}
//                                     className="
//                                         w-full
//                                         rounded-lg
//                                         border
//                                         border-[#e9e6e1]
//                                         px-4
//                                         py-3
//                                         outline-none
//                                         focus:ring-2
//                                         focus:ring-[#a47d52]
//                                         focus:border-[#a47d52]
//                                         text-[#4a4a4a]
//                                         placeholder:text-[#8a7e6f]
//                                         transition
//                                     "
//                                 />

//                             </div>

//                         )}


//                         {/* Password */}

//                         <div>

//                             <label
//                                 className="
//                                     block
//                                     text-sm
//                                     font-medium
//                                     text-[#8a7e6f]
//                                     mb-1.5
//                                 "
//                             >
//                                 Password
//                             </label>

//                             <div className="relative">

//                                 <input
//                                     ref={passwordRef}
//                                     name="password"
//                                     type={showPassword ? "text" : "password"}
//                                     value={form.password}
//                                     onChange={handleChange}
//                                     placeholder="Enter your password"
//                                     required
//                                     style={{ backgroundColor: '#f8f7f5' }}
//                                     className="
//                                         w-full
//                                         rounded-lg
//                                         border
//                                         border-[#e9e6e1]
//                                         px-4
//                                         py-3
//                                         pr-12
//                                         outline-none
//                                         focus:ring-2
//                                         focus:ring-[#a47d52]
//                                         focus:border-[#a47d52]
//                                         transition
//                                         text-[#4a4a4a]
//                                         placeholder:text-[#8a7e6f]
//                                     "
//                                 />

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setShowPassword((prev) => !prev)
//                                     }
//                                     className="
//                                         absolute
//                                         right-3
//                                         top-1/2
//                                         -translate-y-1/2
//                                         text-[#8a7e6f]
//                                         hover:text-[#a47d52]
//                                         cursor-pointer
//                                         transition
//                                     "
//                                     aria-label={
//                                         showPassword
//                                             ? "Hide password"
//                                             : "Show password"
//                                     }
//                                 >

//                                     {showPassword ? (
//                                         <FaEyeSlash size={18} />
//                                     ) : (
//                                         <FaEye size={18} />
//                                     )}

//                                 </button>

//                             </div>

//                         </div>


//                         {/* Login Button */}

//                         <button
//                             type="submit"
//                             className="
//                                 w-full
//                                 bg-[#a47d52]
//                                 hover:bg-[#8a6a44]
//                                 text-white
//                                 font-extrabold
//                                 py-3
//                                 rounded-lg
//                                 transition
//                                 duration-200
//                                 cursor-pointer
//                                 shadow-md
//                                 hover:shadow-lg
//                             "
//                         >
//                             Sign In
//                         </button>

//                     </form>


//                     {/* -------------------------------- */}
//                     {/* Back to Normal Login */}
//                     {/* -------------------------------- */}

//                     {loginMode && (

//                         <button
//                             type="button"
//                             onClick={handleNormalLogin}
//                             className="
//                                 w-full
//                                 mt-4
//                                 text-md
//                                 text-[#a47d52]
//                                 hover:text-[#8a6a44]
//                                 transition
//                                 cursor-pointer
//                                 font-extrabold
//                             "
//                         >
//                             Back to normal login
//                         </button>

//                     )}


//                     {/* -------------------------------- */}
//                     {/* Message */}
//                     {/* -------------------------------- */}

//                     {msg && (

//                         <div
//                             className="
//                                 mt-4
//                                 rounded-lg
//                                 bg-[#e9e6e1]
//                                 border
//                                 border-[#d5d1ca]
//                                 px-4
//                                 py-3
//                             "
//                         >

//                             <p
//                                 className="
//                                     text-sm
//                                     text-[#73765a]
//                                     text-center
//                                 "
//                             >
//                                 {msg}
//                             </p>

//                         </div>

//                     )}


//                     {/* -------------------------------- */}
//                     {/* Signup */}
//                     {/* -------------------------------- */}

//                     {!loginMode && (

//                         <div
//                             className="
//                                 mt-6
//                                 text-center
//                                 text-sm
//                             "
//                         >
//                             <span className="text-[#8a7e6f]">
//                                 Don't have an account?
//                             </span>

//                             <a
//                                 href=""
//                                 className="
//                                     ml-2
//                                     font-semibold
//                                     text-[#a47d52]
//                                     underline
//                                     hover:text-[#8a6a44]
//                                     transition
//                                 "
//                             >
//                                 Create new account
//                             </a>

//                         </div>

//                     )}

//                 </div>

//             </div>

//         </div>
//     );
// }

// export default Login;
