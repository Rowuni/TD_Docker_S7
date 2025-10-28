import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError('Erreur lors du chargement des départements');
      console.error(err);
    }
  };

  const fetchStudents = async (deptName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/departments/${deptName}/students`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Erreur lors du chargement des étudiants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (e) => {
    const dept = e.target.value;
    setSelectedDept(dept);
    if (dept) {
      fetchStudents(dept);
    } else {
      setStudents([]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Liste des Étudiants</h1>
        <p className="subtitle">Gestion des étudiants par département</p>
      </header>

      <main className="App-main">
        <div className="selector-container">
          <label htmlFor="dept-select">Sélectionner un département :</label>
          <select 
            id="dept-select"
            value={selectedDept} 
            onChange={handleDeptChange}
            className="dept-select"
          >
            <option value="">-- Choisir un département --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Chargement...</div>
        ) : students.length > 0 ? (
          <div className="students-container">
            <h2>Étudiants du département {selectedDept}</h2>
            <table className="students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Département</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.firstname}</td>
                    <td>{student.lastname}</td>
                    <td>{student.department?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="count">Total : {students.length} étudiant(s)</p>
          </div>
        ) : selectedDept ? (
          <div className="no-data">Aucun étudiant trouvé dans ce département</div>
        ) : null}
      </main>

      <footer className="App-footer">
        <p>Application déployée via CI/CD avec GitHub Actions</p>
      </footer>
    </div>
  );
}

export default App;
