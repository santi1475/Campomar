import Link from "next/link";
import { buttonVariants } from "./ui/button";

const Navbar = () => {
  return (
    <div className="bg-zinc-100 py-2 border-b border-s-zinc-200 fixed w-full z-10 top-0">
      <div className="container flex items-center justify-between">
        <Link href="/" className="text-brandPrimary text-2xl">
          Restaurante Campomar
        </Link>
        <Link className={`${buttonVariants()} bg-brandSecondary`} href="/login">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
