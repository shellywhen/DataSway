import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"

import './index.css'
import About from './pages/About.tsx'
import Gallery from './pages/Gallery.tsx'
import Board from './pages/Board.tsx'
import Tool from './pages/Tool.tsx'
import { BASE_URL } from './assets/constant.ts'

// React Router expects basename without trailing slash; Vite BASE_URL ends with '/'.
const routerBasename =
  BASE_URL === '/' ? undefined : BASE_URL.replace(/\/$/, '')

const router = createBrowserRouter([
  {
    path: "/workspace",
    element: (
      <Tool />
    ),
  }, {
    path: "/board",
    element: (
      <Board/>
    )

  },
  {
    path: "/gallery",
    element: <Gallery/>,
  },
  {
    path: "/",
    element: <About/>,
  },
], {
  basename: routerBasename,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
   <RouterProvider router={router} />,
)
