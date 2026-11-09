/* مواعيد المواد المستخرجة من ملفات الأوتلاين (خريف 2026).
   الملفات تذكر أرقام الأسابيع فقط، فيحسب الموقع التواريخ من تاريخ بداية الفصل الذي يحدده الطالب.
   week: رقم الأسبوع، weekEnd: نهاية المدى إن كان الموضوع يمتد عدة أسابيع.
   الأنواع: exam, quiz, assignment, project, lecture, other */
window.MADAR_OUTLINES = {
  courses: [
    {
      code: "MASF 2003",
      name: "Introduction to Marine Science and Fisheries",
      events: [
        { week: 1, type: "lecture", title: "Course brief and outline", note: "فترة الحذف والإضافة" },
        { week: 2, type: "lecture", title: "Lecture 1: Introducing the Fishery System" },
        { week: 2, type: "assignment", title: "Lab: Lab safety (1%)", note: "مجموعة الطلاب 09:00–09:50" },
        { week: 3, type: "lecture", title: "Lecture 2: Introducing the Marine Science" },
        { week: 3, type: "assignment", title: "Lab: Microscope handling (1%)", note: "مجموعة الطلاب 08:00–08:50" },
        { week: 4, type: "lecture", title: "Lecture 3: Natural System" },
        { week: 4, type: "assignment", title: "Lab: Fishing knots (1%)", note: "للطلاب، قاعة AGR0010" },
        { week: 5, type: "lecture", title: "Lecture 4: Exploited Species" },
        { week: 5, type: "assignment", title: "Lab: Fish external and internal morphology (1%)", note: "للطلاب" },
        { week: 6, type: "lecture", title: "Lecture 5: Biophysical environment" },
        { week: 6, type: "assignment", title: "Lab: Oceanography (1%)", note: "للطلاب" },
        { week: 7, type: "lecture", title: "Lecture 6: Ecosystem" },
        { week: 8, type: "exam", title: "Test 1 (25%)" },
        { week: 9, type: "lecture", title: "Lecture 7: Introduction to Human System + fishers" },
        { week: 9, weekEnd: 13, type: "project", title: "Field trip to Al Qurum or video report (5%)", note: "التاريخ لم يحدد في الأوتلاين" },
        { week: 10, type: "lecture", title: "Lecture 8: Fishing gears" },
        { week: 11, type: "lecture", title: "Lecture 9: Post-harvest & Dimension of the Fishery" },
        { week: 12, type: "lecture", title: "Lectures 10–11: Fisheries management" },
        { week: 13, type: "lecture", title: "Lectures 12–13: Policy & Planning, Fisheries Development and Research" },
        { week: 14, type: "lecture", title: "Aquaculture", note: "زيارة محطة الحيل أو AES" },
        { week: 15, type: "exam", title: "Test 2 (25%)" },
        { week: 16, type: "exam", title: "Final Exam (40%)" }
      ]
    },
    {
      code: "CAMS 3001",
      name: "Biometry and Experimental Design in Agricultural & Marine Sciences",
      events: [
        { week: 1, type: "lecture", title: "Introduction to Statistics", note: "Chapter 2 · واجب منزلي" },
        { week: 2, type: "lecture", title: "Types of variables, data presentation, mean/median/mode, standard deviation", note: "Lab 1: Excel and frequency distribution · واجب منزلي" },
        { week: 3, type: "lecture", title: "Standard error of the mean and confidence limits for large samples", note: "Chapter 3 · Lab 2 · واجب منزلي" },
        { week: 4, type: "lecture", title: "Confidence limits for small samples; variance and t-tests for large samples", note: "Chapters 3–4 · Lab 3 · واجب منزلي" },
        { week: 5, type: "lecture", title: "Types of t-tests", note: "Chapter 8 · Lab 4" },
        { week: 5, type: "quiz", title: "Quiz I (5%)" },
        { week: 6, type: "lecture", title: "Various types of t-tests", note: "Chapter 11 · Lab 5 · واجب منزلي" },
        { week: 7, type: "lecture", title: "Single-factor analysis of variance (F-tests) / Experimental design", note: "Chapter 9" },
        { week: 7, type: "assignment", title: "HW Report I (7%)" },
        { week: 8, type: "exam", title: "Midterm Examination (25%)", note: "Lab 6 · واجب منزلي" },
        { week: 9, type: "lecture", title: "Two-factor analysis of variance", note: "Chapters 9–10 · Lab 6 · واجب منزلي" },
        { week: 10, type: "lecture", title: "Correlation analysis", note: "Chapter 17 · Lab 7 · واجب منزلي" },
        { week: 11, type: "lecture", title: "Regression analysis", note: "Chapter 17 · Lab 8 · واجب منزلي" },
        { week: 12, type: "lecture", title: "Chi-square analysis", note: "Chapter 18 · Lab 9 · واجب منزلي" },
        { week: 12, type: "quiz", title: "Quiz 2 (5%)" },
        { week: 13, type: "lecture", title: "Practice (laboratory manual exercises)", note: "Lab 13" },
        { week: 13, type: "assignment", title: "Lab Report II (8%)" },
        { week: 14, type: "exam", title: "Final Examination, practical (25%)" },
        { week: 15, type: "exam", title: "Final Examination, theory (25%)" }
      ]
    },
    {
      code: "CAMS 3000",
      name: "Seminar and Presentation Skills",
      events: [
        { week: 1, weekEnd: 2, type: "lecture", title: "Syllabus overview, students grouping, research paper structure" },
        { week: 3, weekEnd: 5, type: "lecture", title: "How to write an abstract (Group 1), APA reference and citation (Group 2)" },
        { week: 3, weekEnd: 5, type: "assignment", title: "Homework I: abstract" },
        { week: 6, weekEnd: 9, type: "lecture", title: "MLA (Group 3) and Chicago (Group 4) reference and citation, in-class practice" },
        { week: 6, weekEnd: 9, type: "exam", title: "Midterm test 1", note: "الأسبوع يحدده أستاذ الشعبة" },
        { week: 10, weekEnd: 12, type: "lecture", title: "Literature review (Group 5), research methodology (Group 6), data presentation (Group 7), plagiarism" },
        { week: 10, weekEnd: 12, type: "exam", title: "Midterm test 2", note: "الأسبوع يحدده أستاذ الشعبة" },
        { week: 13, weekEnd: 15, type: "project", title: "Individual presentations (25%)", note: "Oral presentation guidelines" }
      ]
    }
  ]
};
