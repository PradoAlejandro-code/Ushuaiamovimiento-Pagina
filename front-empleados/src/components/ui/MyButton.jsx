const MyButton = ({ children, className, ...props }) => {
  return (
    <button
      className={`w-full py-3 px-4 rounded-xl font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default MyButton;
