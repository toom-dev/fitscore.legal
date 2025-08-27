import MultiStepForm from "@/src/components/multi-step-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <MultiStepForm />
      </div>
    </div>
  );
}
