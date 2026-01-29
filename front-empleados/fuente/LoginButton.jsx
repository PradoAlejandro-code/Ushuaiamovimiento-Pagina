const LoginButton = ({ children, ...props }) => {
  return (
    <button
      type="submit"
     className="w-full py-3 px-4 rounded-xl text-white font-medium
                bg-gradient-to-r from-orange-500 to-blue-600
                hover:from-orange-600 hover:to-blue-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600
                transition disabled:opacity-60 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </button>
  );
};

export default LoginButton;
