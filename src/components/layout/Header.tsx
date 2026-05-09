import { useState } from "react"
import { IoMdSettings } from "react-icons/io"
import { MdLogout, MdPerson } from "react-icons/md"
import { Link, useNavigate } from "react-router-dom"

const Header = ({ title }: { title: string }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const userRoleStr = localStorage.getItem('userRole');
  const userRoles = userRoleStr ? JSON.parse(userRoleStr) : [];
const isSuperAdmin = userRoles.includes('SUPERADMIN');


const navigate  = useNavigate();
    const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <div className="bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-[#1E2633] font-bricolage">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" onClick={()=>{navigate('/settings/notifications')}}>
          <span className="text-xl text-gray-500">
            <img src="/bell.svg" alt="bell" />
          </span>
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-brand-orange rounded-full border-2 border-white"></span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={`https://ui-avatars.com/api/?name=${isSuperAdmin ? "Super+Admin" : "Operational+Admin"}&background=1E2633&color=fff`}
                alt="Admin"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-bold text-[#1E2633] pr-2 tracking-wide uppercase">
              {isSuperAdmin ? "SUPER ADMIN" : "OPERATIONAL ADMIN"}
            </span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link to={'/settings'} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
               <MdPerson size={18} /> Profile
              </Link>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                <IoMdSettings size={18} />  Settings
              </button>
              <div className="h-px bg-gray-100 my-2"></div>
              <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2" onClick={handleLogout}>
               <MdLogout size={18} />  Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
