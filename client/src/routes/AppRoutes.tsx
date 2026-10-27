import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import TeacherLessons from "../pages/TeacherLessons";
import TeacherStudents from "../pages/TeacherStudents";
import ParentLessons from "../pages/ParentLessons";
import BookLesson from "../pages/BookLesson";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import StudentForm from "../pages/StudentForm";
import StudentProfile from "../pages/StudentProfile";

export const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    {
        element: <Layout />, children: [
            { path: "teacher",element:<ProtectedRoute role="TEACHER"/>,children:
            [
                {path:"lessons",element:<TeacherLessons/>},
                { path:"students", element: <TeacherStudents />},
                {path: "students/new",element:<StudentForm/>},

        ] },
       {
        path:"parent",element:<ProtectedRoute role="STUDENT"/>,children:[
            {path:"lessons",element:<ParentLessons />},
            {path:"book",element:<BookLesson/>},
            {path: "profile",element:<StudentProfile/>}
        ]
       }
    ]
    },
    { path: "*", element: <Navigate to="/login" replace /> }
])
