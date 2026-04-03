import React, { useState, useEffect } from 'react';

const parseSheetData = (sheetData) => {
  const headers = sheetData[0].map(header => header.trim().toLowerCase());
  return sheetData.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header === 'id' || header === 'horod' || header === 'user' || header === 'date' || header === 'chef equipe' || header === 'pdf url') {
        obj[header] = row[index] || '';
      } else {
        obj[header] = parseFloat(row[index]) || 0;
      }
    });
    return obj;
  });
};

// Fonction pour convertir les dates françaises (DD/MM/YYYY) vers le format ISO
const parseFrenchDate = (dateString) => {
  if (!dateString) return null;
  
  // Gestion du format "DD/MM/YYYY HH:MM" ou "DD/MM/YYYY"
  const parts = dateString.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '00:00';
  
  const [day, month, year] = datePart.split('/');
  if (!day || !month || !year) return null;
  
  // Création de la date au format ISO (YYYY-MM-DD)
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return new Date(`${isoDate}T${timePart.padEnd(5, '0')}:00`);
};

const VacationsReports = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const SHEET_ID_CR = process.env.REACT_APP_REPORTS_SHEET_ID_CR;
  const API_KEY = process.env.REACT_APP_API_KEY;
  const RANGE = 'PdfR!A1:G';

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID_CR}/values/${RANGE}?key=${API_KEY}`
        );
        const result = await response.json();

        if (result.values) {
          const parsedData = parseSheetData(result.values);
          setData(parsedData);
          setFilteredData(parsedData);
        } else {
          setError('Aucune donnée trouvée');
        }
      } catch (err) {
        setError("Une erreur est survenue lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  // Fonction pour filtrer par dates
  const filterByDate = () => {
    if (!startDate && !endDate) {
      setFilteredData(data);
      setCurrentPage(1);
      return;
    }

    const filtered = data.filter(item => {
      const itemDate = parseFrenchDate(item.date);
      if (!itemDate) return false;
      
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return itemDate >= start && itemDate <= end;
      } else if (start) {
        return itemDate >= start;
      } else if (end) {
        return itemDate <= end;
      }
      return true;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseFrenchDate(dateString);
    return date ? date.toLocaleDateString('fr-FR') : '';
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = parseFrenchDate(dateTimeString);
    return date ? date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '';
  };

  const getFileSize = (url) => {
    const sizes = ['272.17 KB', '283.63 KB', '204.46 KB', '191.77 KB'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  };

  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const styles = {
    container: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
      marginBottom: '24px'
    },
    filterCard: {
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    filterRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    filterLabel: {
      fontWeight: '600',
      color: '#374151',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    dateLabel: {
      fontWeight: '500',
      color: '#64748b',
      fontSize: '14px'
    },
    dateInput: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      width: '160px',
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },
    button: {
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: '#22c55e',
      color: 'white',
      boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)'
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: '#64748b',
      border: '1px solid #e2e8f0'
    },
    card: {
      padding: '24px',
      borderRadius: '16px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      marginBottom: '16px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '16px',
      letterSpacing: '0.025em'
    },
    badgeDot: {
      width: '6px',
      height: '6px',
      backgroundColor: '#22c55e',
      borderRadius: '50%',
      marginRight: '6px'
    },
    cardTitle: {
      fontWeight: '700',
      color: '#22c55e',
      marginBottom: '8px',
      lineHeight: '1.4',
      fontSize: '18px'
    },
    cardId: {
      color: '#64748b',
      fontSize: '14px',
      marginBottom: '8px',
      fontWeight: '600',
      fontFamily: 'monospace'
    },
    cardAuthor: {
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500'
    },
    actionSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px'
    },
    viewButton: {
      backgroundColor: '#22c55e',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      fontWeight: '600',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
      fontSize: '14px'
    },
    fileSize: {
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: '500'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '32px',
      gap: '16px'
    },
    paginationCard: {
      padding: '16px 24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    paginationInfo: {
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500'
    },
    paginationButtons: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    pageButton: {
      minWidth: '40px',
      height: '40px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    activePageButton: {
      border: '1px solid #22c55e',
      backgroundColor: '#22c55e',
      color: 'white',
      fontWeight: '600'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #f1f5f9',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Comptes rendus de vacations</h1>
        <p style={styles.subtitle}>
          {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''} trouvé{filteredData.length > 1 ? 's' : ''}
        </p>

        {/* Filtres de dates */}
        <div style={styles.filterCard}>
          <div style={styles.filterRow}>
            <div style={styles.filterLabel}>
              Filtrer par période
            </div>
            <span style={styles.dateLabel}>Du</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.dateInput}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <span style={styles.dateLabel}>au</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.dateInput}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={filterByDate}
              style={{...styles.button, ...styles.primaryButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#22c55e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#87e8aa'}
            >
              Filtrer
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setFilteredData(data);
                  setCurrentPage(1);
                }}
                style={{...styles.button, ...styles.secondaryButton}}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <div style={styles.spinner}></div>
        </div>
      ) : error ? (
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '12px'
        }}>
          <p style={{ color: '#ef4444', fontWeight: '500', margin: 0 }}>{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{ 
          padding: '48px', 
          textAlign: 'center',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          backgroundColor: 'white'
        }}>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
            Aucune donnée disponible pour cette période
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '32px' }}>
            {currentData.map((item) => (
              <div
                key={item.id}
                style={styles.card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: '24px'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Badge Consulté */}
                    <div style={styles.badge}>
                      <div style={styles.badgeDot}></div>
                      Consulté
                    </div>

                    {/* Titre principal */}
                    <h3 style={styles.cardTitle}>
                      CR du {formatDate(item.date)}
                    </h3>

                    {/* Numéro de référence */}
                    <p style={styles.cardId}>
                      N°{item.id}
                    </p>

                    {/* Chef équipe rédacteur */}
                    <p style={styles.cardAuthor}>
                      Réalisé par {item['chef equipe'] || 'Inconnu'}
                    </p>
                  </div>

                  {/* Bouton d'action */}
                  <div style={styles.actionSection}>
                    {item['pdf url'] ? (
                      <a
                        href={item['pdf url']}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{...styles.button, ...styles.viewButton, textDecoration: 'none'}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#22c55e'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#87e8aa'}
                      >
                        Voir le résultat
                      </a>
                    ) : (
                      <button
                        disabled
                        style={{
                          ...styles.button,
                          backgroundColor: '#87e8aa',
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          cursor: 'not-allowed'
                        }}
                      >
                        Non disponible
                      </button>
                    )}
                    <span style={styles.fileSize}>
                      PDF {getFileSize(item['pdf url'])}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <div style={styles.paginationCard}>
                <span style={styles.paginationInfo}>
                  Affichage {startIndex + 1}-{Math.min(endIndex, filteredData.length)} sur {filteredData.length}
                </span>
                
                <div style={styles.paginationButtons}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      ...styles.pageButton,
                      color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ‹
                  </button>
                  
                  {(() => {
                    let startPage = Math.max(1, currentPage - 1);
                    let endPage = Math.min(totalPages, startPage + 2);
                    
                    if (endPage - startPage < 2) {
                      startPage = Math.max(1, endPage - 2);
                    }
                    
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    return pages.map(i => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        style={{
                          ...styles.pageButton,
                          ...(currentPage === i ? styles.activePageButton : {color: '#64748b'})
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== i) {
                            e.target.style.backgroundColor = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== i) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {i}
                      </button>
                    ));
                  })()}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.pageButton,
                      color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Animation CSS pour le spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VacationsReports;