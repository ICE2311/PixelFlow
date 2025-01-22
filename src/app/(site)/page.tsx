'use client'
import Hero from "~/components/Hero";
import Brands from "~/components/Brands";
import Feature from "~/components/Features";
import FeaturesTab from "~/components/FeaturesTab";
import Integration from "~/components/Integration";
import CTA from "~/components/CTA";
import FAQ from "~/components/FAQ";
import Contact from "~/components/Contact";
import Testimonial from "~/components/Testimonial";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);
  return (
    <main>
      <Hero />
      <Brands />
      <Feature />
      <FeaturesTab />
      <Integration />
      <CTA />
      <FAQ />
      <Testimonial />
      <Contact />
    </main>
  );
}
