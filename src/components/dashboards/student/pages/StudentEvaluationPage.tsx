};

// Convert UI filters to API format for score trend
const getScoreTrendApiFilters = (filters: typeof scoreTrendFilters): ScoreTrendFilters => {
  const apiFilters: ScoreTrendFilters = {
    student_id: user?._id || '',
    group_by: 'student'
  };

  return apiFilters;
};

// Convert UI filters to API format for subject mastery
const getSubjectMasteryApiFilters = (filters: typeof subjectMasteryFilters): SubjectMasteryFilters => {
  const apiFilters: SubjectMasteryFilters = {
    student_id: user?._id || '',
    min_exams_per_subject: filters.minExamsPerSubject,
  };

  return apiFilters;
};

        <ScoreTrendAnalytics
          ref={scoreTrendRef}
          defaultFilters={getScoreTrendApiFilters(scoreTrendFilters)}
          height={300}
        />
      </div>

        <SubjectMasteryAnalytics
          ref={subjectMasteryRef}
          defaultFilters={getSubjectMasteryApiFilters(subjectMasteryFilters)}
          height={300}
          title="Penguasaan Mata Pelajaran"
        />