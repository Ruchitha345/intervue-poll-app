
export default function pollview({ results, totalStudents }) {
  return (
    <div className="results">
      {Object.entries(results).map(([opt, count]) => {
        const percent = totalStudents ? Math.round((count / totalStudents) * 100) : 0;
        return (
          <div key={opt} className="result-row">
            <div className="result-label">{opt}</div>
            <div className="bar">
              <div className="bar-inner" style={{ width: `${percent}%` }}></div>
            </div>
            <div className="percent">{percent}%</div>
          </div>
        );
      })}
    </div>
  );
}
