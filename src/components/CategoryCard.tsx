
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const Icon = category.icon;
  
  return (
    <Link to={`/category/${category.id}`}>
      <Card className="hover-lift cursor-pointer group border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md">
        <CardContent className="p-6 text-center">
          <div 
            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${category.color}15`, color: category.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-1 text-sm sm:text-base text-gray-900">{category.name}</h3>
          <p className="text-xs text-gray-600">{category.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
