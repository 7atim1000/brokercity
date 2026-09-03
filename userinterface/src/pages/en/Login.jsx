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
                    "Login successful! Redirecting..."
                );


                setTimeout(() => {

                    navigate("/ar-dashboard");

                }, 800);


            } else {

                setMsg(
                    data.detail ||
                    "Login failed. Please try again."
                );

            }


        } catch (error) {

            console.error(error);

            setMsg(
                "An error occurred during login. Please try again."
            );

        }
    };


    return (

        <div
            dir="ltr"
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
                        <div className='flex flex-col justify-center md:flex md:flex-row md:justify-between items-center w-full'>
                            <img
                                src={logo}
                                alt="Logo"
                                className="
                                    w-16 h-16 md:w-20 md:h-20
                                    object-contain
                                    rounded-lg
                                    mb-3 md:mb-0
                                "
                            />

                            <h1 className="
                                text-2xl md:text-3xl
                                font-bold
                                text-[#a47d52]
                                font-extrabold
                                mb-1 md:mb-0
                            ">
                                Broker City Properties
                            </h1>

                        </div>
                        

                        <div className="w-12 h-1 bg-[#a47d52] rounded-full mb-2 md:hidden"></div>

                       
                        <div 
                            className="flex flex-row items-center justify-start gap-2 px-2 py-1 rounded-md hover:bg-[#e9e6e1] transition-colors cursor-pointer"
                            onClick={() => navigate('/ar-login')}
                        >
                            <FaLanguage className="text-green-600 w-4 h-4" />
                            <p className="text-[#8a7e6f] text-sm font-medium m-0 p-0">
                                AR
                            </p>
                        </div>
                        

                        <p className="text-[#8a7e6f] text-sm text-center">
                            Welcome to your integrated real estate platform
                        </p>

                        <p className="text-[#8a7e6f] text-xs text-center mt-1 opacity-70">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    {/* -------------------------------- */}
                    {/* Quick Login Buttons */}
                    {/* -------------------------------- */}

                    {!loginMode && (

                       <div className="mb-6 flex flex-col gap-3 shadow-lg bg-[#f8f7f5] p-2">
  {/* Owner / Manager - Full width on md+ screens */}
  <button
    type="button"
    onClick={() => handleUserLogin("manager")}
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
    <div className='flex flex-col md:flex-row md:items-center gap-2'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1 flex-wrap'>
          <span className='font-extrabold text-sm text-white'>Mr</span>
          <span className='text-xs text-white'>/</span>
          <span className='font-extrabold text-lg md:text-xl text-white'>Abu Hamdan</span>
        </div>
        <span className='font-normal text-sm md:text-base text-white'>Director General</span>
      </div>
    </div>
  </button>

  {/* Other buttons grid - 2 columns on md+ screens */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => handleUserLogin("muhsin")}
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
      <div className='flex flex-col md:flex-row md:items-center gap-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='font-extrabold text-sm text-white'>Mr</span>
            <span className='text-xs text-white'>/</span>
            <span className='font-extrabold text-lg md:text-xl text-white'>Abu Khalid</span>
          </div>
          <span className='font-normal text-sm md:text-base text-white'>Administrative Manager</span>
        </div>
      </div>
    </button>

    <button
      type="button"
      onClick={() => handleUserLogin("ghada")}
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
      <div className='flex flex-col md:flex-row md:items-center gap-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='font-extrabold text-sm text-white'>Ms</span>
            <span className='text-xs text-white'>/</span>
            <span className='font-extrabold text-lg md:text-xl text-white'>Ghada</span>
          </div>
          <span className='font-normal text-sm md:text-base text-white'>Personnel Manager</span>
        </div>
      </div>
    </button>

    <button
      type="button"
      onClick={() => handleUserLogin("muhammed")}
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
      <div className='flex flex-col md:flex-row md:items-center gap-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='font-extrabold text-sm text-white'>Ms</span>
            <span className='text-xs text-white'>/</span>
            <span className='font-extrabold text-lg md:text-xl text-white'>Muhammed</span>
          </div>
          <span className='font-normal text-sm md:text-base text-white'>Marketing Manager</span>
        </div>
      </div>
    </button>

    <button
      type="button"
      onClick={() => handleUserLogin("abubakr")}
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
      <div className='flex flex-col md:flex-row md:items-center gap-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='font-extrabold text-sm text-white'>Ms</span>
            <span className='text-xs text-white'>/</span>
            <span className='font-extrabold text-lg md:text-xl text-white'>Abubakr</span>
          </div>
          <span className='font-normal text-sm md:text-base text-white'>Legal Counsel</span>
        </div>
      </div>
    </button>
  </div>
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

                            {/* <p className="text-sm text-[#73765a] font-medium">

                                {loginMode === "manager"
                                    ? "General Manager Login"
                                    : "Ms. Ghada Login"}

                            </p> */}

                            <p className="text-xs text-[#8a7e6f] mt-1">
                                User: {loginMode}
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
                                    Username
                                </label>

                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    required
                                    style={{ backgroundColor: '#f8f7f5' }}
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
                                Password
                            </label>

                            <div className="relative">

                                <input
                                    ref={passwordRef}
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                    style={{ backgroundColor: '#f8f7f5' }}
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-[#e9e6e1]
                                        px-4
                                        py-3
                                        pr-12
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
                                        right-3
                                        top-1/2
                                        -translate-y-1/2
                                        text-[#8a7e6f]
                                        hover:text-[#a47d52]
                                        cursor-pointer
                                        transition
                                    "
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
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
                            Sign In
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
                            Back to normal login
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
                                Don't have an account?
                            </span>

                            <a
                                href=""
                                className="
                                    ml-2
                                    font-semibold
                                    text-[#a47d52]
                                    underline
                                    hover:text-[#8a6a44]
                                    transition
                                "
                            >
                                Create new account
                            </a>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Login;