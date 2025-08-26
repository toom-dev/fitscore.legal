import MultiStepForm from "@/src/components/multi-step-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-4">
        <MultiStepForm />
      </div>
    </div>
  );
}
