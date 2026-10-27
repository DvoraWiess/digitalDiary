import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../context/authContext"

const Layout=()=>{
    const {user,logout}=useAuth()
    return(
        <>
        <header className="bg-white border-b-3 border-sage-600 px-4 sm:px-6 py-5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <h1 className="font-heading text-3xl text-sage-700 flex items-center gap-2.5 before:content-[''] before:size-11 before:shrink-0 before:bg-[url(/logo.svg)] before:bg-contain before:bg-no-repeat">יומן שיעורים</h1>
            <nav className="order-last w-full flex gap-1 overflow-x-auto md:order-none md:w-auto md:me-auto">
                {user?.role==='TEACHER'&&(
                    <>
                    <NavLink to="/teacher/lessons" className="px-4.5 py-2 rounded-full text-lg font-semibold text-sage-500 whitespace-nowrap hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 [&.active]:bg-sage-100 [&.active]:text-sage-700">שיעורים</NavLink>
                    <NavLink to="/teacher/Students" className="px-4.5 py-2 rounded-full text-lg font-semibold text-sage-500 whitespace-nowrap hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 [&.active]:bg-sage-100 [&.active]:text-sage-700">תלמידים</NavLink>
                    </>
                )}
                {user?.role==='STUDENT'&&(
                    <>
                    <NavLink to="/parent/lessons" className="px-4.5 py-2 rounded-full text-lg font-semibold text-sage-500 whitespace-nowrap hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 [&.active]:bg-sage-100 [&.active]:text-sage-700">השיעורים שלי</NavLink>
                    <NavLink to="/parent/book" className="px-4.5 py-2 rounded-full text-lg font-semibold text-sage-500 whitespace-nowrap hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 [&.active]:bg-sage-100 [&.active]:text-sage-700">קביעת שיעור</NavLink>
                    <NavLink to="/parent/profile" className="px-4.5 py-2 rounded-full text-lg font-semibold text-sage-500 whitespace-nowrap hover:bg-sage-50 hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 [&.active]:bg-sage-100 [&.active]:text-sage-700">פרטי התלמיד</NavLink>
                    </>
                )}

            </nav>
            <span className="ms-auto md:ms-0 bg-sage-100 border-s-4 border-sage-600 rounded-e-md px-3.5 py-1.5 text-base font-semibold text-sage-700 empty:hidden">{user?.username}</span>
            <button type="button" onClick={logout} className="rounded-full border border-sage-300 bg-white px-4.5 py-1.5 text-base font-semibold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600">יציאה</button>
        </header>
        <main className="max-w-5xl mx-auto p-4 before:content-[''] before:fixed before:inset-0 before:-z-10 before:bg-[url(/letters.svg)] before:bg-repeat before:bg-[length:900px_640px] before:opacity-60">
            <Outlet/>

            
        </main>
        </>
    )
}
export default Layout