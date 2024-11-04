'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface SidebarProps {
  onFilterById: (id: string) => void;
  onClearFilter: () => void;
  selectedId: string | null;
}

const Sidebar = ({ onFilterById, onClearFilter, selectedId }: SidebarProps) => {
  return (
    <Card className="w-100 h-full rounded-none border-r px-24 mx-20">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Item ID Filter */}
          <div className="space-y-2">
            <Label htmlFor="item-id">Filter by Item ID</Label>
            <div className="flex gap-2">
              <Input
                id="item-id"
                placeholder="Enter Item ID"
                value={selectedId || ''}
                onChange={(e) => onFilterById(e.target.value)}
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={onClearFilter}
                disabled={!selectedId}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Sidebar;