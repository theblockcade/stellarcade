import { NotFoundGlitch } from "@/components/ui/be-ui-404-not-found";

export default function NotFound() {
  return (
    <NotFoundGlitch
      description="The page you are looking for does not exist or has been moved."
      homeHref="/"
      homeLabel="Go home"
      browseHref="/games"
      browseLabel="Browse games"
    />
  );
}
