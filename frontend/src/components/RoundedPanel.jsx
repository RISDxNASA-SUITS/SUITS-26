export default function RoundedPanel({ children, className = '' }) {
  return (
    <div className={`bg-gradient-to-t from-[rgba(0,0,0,0.1)] to-[rgba(136,136,136,0.1)] rounded-bl-[45px] rounded-tl-[45px] border-[#014663] border-[0.45px] overflow-clip ${className}`}>
      {children}
    </div>
  )
}
