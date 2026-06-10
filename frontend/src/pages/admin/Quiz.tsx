import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function QuizManagement() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ngân hàng Câu hỏi Quiz</h1>
          <p className="text-muted-foreground">Quản lý các câu đố cho từng địa điểm.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Câu Hỏi
        </Button>
      </div>

      <div className="bg-surface rounded-lg border border-border p-8 text-center text-muted-foreground">
        Chức năng quản lý Quiz sẽ được cập nhật sớm.
      </div>
    </div>
  );
}


