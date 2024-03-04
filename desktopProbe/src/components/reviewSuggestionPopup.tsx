import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function ReviewSuggestionPopup() {
  return (
    <div className="space-y-4 mb-2">
      <Link to="/writeReview">
        <Button size="sm" className="w-full px-4">
          Give us some feedback!
        </Button>
      </Link>
    </div>
  );
}
