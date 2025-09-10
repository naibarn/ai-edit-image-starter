import '../src/app/globals.css';
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/edit');
}