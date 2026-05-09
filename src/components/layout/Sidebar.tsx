import { Link, useLocation } from "react-router-dom"
import { MdHomeFilled, MdPerson, MdOutlineSwitchAccount} from "react-icons/md";
import { RiCheckDoubleLine } from "react-icons/ri";


const Sidebar = () => {
  const location = useLocation()
  const userRoleStr = localStorage.getItem('userRole');
  const userRoles = userRoleStr ? JSON.parse(userRoleStr) : [];
const isSuperAdmin = userRoles.includes('SUPERADMIN');

  const navItems = [
    { label: "Home", icon: <MdHomeFilled size={25} />, path: "/dashboard" },
    { label: "Users", icon: <MdOutlineSwitchAccount size={25} />, path: "/users", roles: ['SUPERADMIN'] },
    { label: "Approvals", icon: <RiCheckDoubleLine size={25} />, path: "/approvals" },
    { label: "Profile", icon: <MdPerson size={25} />, path: "/settings" },
  ].filter(item => !item.roles || item.roles.includes(isSuperAdmin ? 'SUPERADMIN' : 'OPERATIONAL_ADMIN'));

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="h-screen bg-[#1E2633] w-75 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-auto h-12 ">
             <img src="/logo.svg" alt="logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <span className="text-secondary text-sm font-semibold tracking-[0.6px] mt-3">
            {isSuperAdmin ? "SUPER ADMIN" : "OPERATIONAL ADMIN"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1  mt-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-6 py-4 transition-all group ${
              isActive(item.path)
                ? "bg-white/10 text-white border-l-4 border-primary"
                : "text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={`text-xl ${isActive(item.path) ? "opacity-100" : "opacity-50 group-hover:opacity-100"}`}>
              {item.icon}
            </span>
            <span className="text-md font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Button */}
      {isSuperAdmin && (
        <div className="p-6">
          <Link 
            to="/coupon-generation/form"
            className="w-full bg-primary hover:bg-[#D9541E] text-white flex items-center justify-center gap-3 py-3 rounded-full transition-all font-bold text-md"
          >
            <img src="/qr_code_2_add.svg" alt="qr" />
            Generate
          </Link>
        </div>
      )}
    </div>
  )
}

export default Sidebar
