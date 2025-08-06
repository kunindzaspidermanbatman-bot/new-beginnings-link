
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import VenueCard from "@/components/VenueCard";
import { categories } from "@/data/mockData";
import { useVenues } from "@/hooks/useVenues";

const CategoryPage = () => {
  const navigate = useNavigate();
  
  // Category page is no longer needed - redirect to home
  React.useEffect(() => {
    navigate('/');
  }, [navigate]);

  return null;
};

export default CategoryPage;
