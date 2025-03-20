"use client";

import PageContainer from "../../components/PageContainer";
import UnderConstruction from "../../components/UnderConstruction";

export default function CalendarPage() {
  return (
    <PageContainer>
      <UnderConstruction 
        title="Reading Calendar"
        message="Your reading streaks and habits will be visualized here. Soon you'll be able to track your daily reading progress!"
        isCalendar={true}
      />
    </PageContainer>
  );
} 