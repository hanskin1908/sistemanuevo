import React, { useState, useEffect } from 'react'

const Notas = () => {
  const [notas, setNotas] = useState([])

  useEffect(() => {
    // Asumimos que el ID del estudiante es 1 por ahora
    fetch('http://localhost:3000/api/estudiantes/1/notas')
      .then(response => response.json())
      .then(data => setNotas(data))
      .catch(error => console.error('Error:', error))
  }, [])

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Notas del Estudiante</h2>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Materia</th>
            <th className="p-2 text-left">Nota</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{nota.materia}</td>
              <td className="p-2">{nota.nota}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Notas