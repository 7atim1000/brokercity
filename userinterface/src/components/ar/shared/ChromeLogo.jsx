import React from "react";

const ChromeLogo = ({ size = 20, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className={className}
    >
        {/* Red — top-left arc */}
        <path
            fill="#EA4335"
            d="M24 4a20 20 0 0 1 17.32 10H24a10 10 0 0 0-9.54 7H4.9A20 20 0 0 1 24 4z"
        />
        {/* Green — bottom-left arc */}
        <path
            fill="#34A853"
            d="M14.46 21A10 10 0 0 0 24 34l-9.54 7A20 20 0 0 1 4.9 21h9.56z"
        />
        {/* Yellow — right arc */}
        <path
            fill="#FBBC05"
            d="M24 34a10 10 0 0 0 9.54-7h9.56A20 20 0 0 1 24 44l-.54-10H24z"
        />
        <path
            fill="#FBBC05"
            d="M33.54 27A10 10 0 0 0 33.54 21H43.1a20 20 0 0 1 0 6h-9.56z"
        />
        {/* Blue inner circle */}
        <circle cx="24" cy="24" r="8" fill="#4285F4" />
        <circle cx="24" cy="24" r="4" fill="#fff" />
    </svg>
);

export default ChromeLogo;