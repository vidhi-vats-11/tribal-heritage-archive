import { Routes, Route, NavLink, Link } from 'react-router-dom';
import ItemsList from './pages/ItemsList.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import AddItem from './pages/AddItem.jsx';
import Sessions from './pages/Sessions.jsx';

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-stone-700 text-white' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
  }`;

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-stone-900">
        <nav className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-2 py-3">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="inline-block h-6 w-6 rounded-sm bg-teal-600" aria-hidden />
            <span className="font-semibold tracking-tight">Tribal Heritage Archive</span>
          </Link>
          <div className="flex gap-1">
            <NavLink to="/" end className={navClass}>Items</NavLink>
            <NavLink to="/sessions" className={navClass}>Field sessions</NavLink>
            <NavLink to="/items/new" className={navClass}>Add item</NavLink>
          </div>
        </nav>
      </header>
      <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-center text-sm py-1.5 px-4">
        Demo data — all records are invented placeholders.
      </div>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<ItemsList />} />
          <Route path="/items/new" element={<AddItem />} />
          <Route path="/items/:identifier" element={<ItemDetail />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="*" element={<p>Page not found. <Link className="text-teal-700 underline" to="/">Back to items</Link></p>} />
        </Routes>
      </main>

      <footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-500">
        Tribal Heritage Archive · prototype · Demo data — all records are invented placeholders.
      </footer>
    </div>
  );
}
