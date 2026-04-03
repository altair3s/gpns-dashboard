import React, { useState, useEffect } from 'react';

const parseSheetData = (sheetData) => {
  const headers = sheetData[0].map(header => header.trim().toLowerCase());
  return sheetData.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header === 'id' || header === 'date' || header === 'nom ce' || header === 'infra' || header === 'lieu' || header === 'pdf url') {
        obj[header] = row[index] || '';
      } else {
        obj[header] = parseFloat(row[index]) || 0;
      }
    });
    return obj;
  });
};

// Fonction pour convertir les dates françaises (DD/MM/YYYY)
const parseFrenchDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/');
  if (!day || !month || !year) return null;
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return new Date(isoDate);
};

// Fonction pour obtenir le secteur (colonne Infra)
const getSecteurFromData = (item) => {
  return item.infra || '';
};

const MecanisationReports = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedSecteur, setSelectedSecteur] = useState('');
  const [selectedLieu, setSelectedLieu] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const SHEET_ID_MECA = process.env.REACT_APP_REPORTS_SHEET_ID_MECA;
  const API_KEY = process.env.REACT_APP_API_KEY;
  const RANGE = 'Pdf!A1:F';

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID_MECA}/values/${RANGE}?key=${API_KEY}`
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

  // Filtrer par secteur et lieu
  useEffect(() => {
    let filtered = data;
    
    // Filtrer par secteur d'abord (colonne Infra)
    if (selectedSecteur !== '') {
      filtered = filtered.filter(row => {
        const secteur = getSecteurFromData(row);
        return secteur === selectedSecteur;
      });
    }
    
    // Puis filtrer par lieu spécifique (colonne Lieu)
    if (selectedLieu !== '') {
      filtered = filtered.filter(row => row.lieu === selectedLieu);
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [selectedSecteur, selectedLieu, data]);

  // Réinitialiser le filtre lieu quand le secteur change
  useEffect(() => {
    setSelectedLieu('');
  }, [selectedSecteur]);

  const getUniqueSecteurs = () => {
    const secteurs = data.map(row => getSecteurFromData(row))
                        .filter(secteur => secteur && secteur.trim() !== '');
    return [...new Set(secteurs)].sort();
  };

  const getUniqueLieuxForSecteur = () => {
    let lieuData = data;
    
    // Si un secteur est sélectionné, filtrer les lieux par secteur
    if (selectedSecteur !== '') {
      lieuData = data.filter(row => {
        const secteur = getSecteurFromData(row);
        return secteur === selectedSecteur;
      });
    }
    
    const lieux = lieuData.map(row => row.lieu).filter(lieu => lieu && lieu.trim() !== '');
    return [...new Set(lieux)].sort();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseFrenchDate(dateString);
    return date ? date.toLocaleDateString('fr-FR') : '';
  };

  // Pagination
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
      gap: '24px',
      flexWrap: 'wrap'
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    filterLabel: {
      fontWeight: '600',
      color: '#374151',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '140px'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '200px',
      outline: 'none',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    resultCount: {
      fontSize: '12px',
      color: '#64748b',
      fontWeight: '500',
      padding: '4px 8px',
      backgroundColor: '#f1f5f9',
      borderRadius: '12px'
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
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '16px'
    },
    badgeDot: {
      width: '6px',
      height: '6px',
      backgroundColor: '#3b82f6',
      borderRadius: '50%',
      marginRight: '6px'
    },
    cardTitle: {
      fontWeight: '700',
      color: '#2563eb',
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
    cardInfo: {
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '4px'
    },
    locationBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '4px 10px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '600',
      marginTop: '8px'
    },
    secteurBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '4px 10px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '600',
      marginTop: '8px',
      marginLeft: '8px'
    },
    actionSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px'
    },
    viewButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      fontWeight: '600',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
      fontSize: '14px',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
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
      border: '1px solid #3b82f6',
      backgroundColor: '#3b82f6',
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
        <h1 style={styles.title}>Comptes rendus de mécanisation</h1>
        <p style={styles.subtitle}>
          {filteredData.length} compte{filteredData.length > 1 ? 's' : ''} rendu{filteredData.length > 1 ? 's' : ''} trouvé{filteredData.length > 1 ? 's' : ''}
        </p>

        {/* Filtres */}
        {!loading && !error && data.length > 0 && (
          <div style={styles.filterCard}>
            <div style={styles.filterRow}>
              {/* Filtre par secteur */}
              <div style={styles.filterGroup}>
                <div style={styles.filterLabel}>
                  🧭 Filtrer par secteur
                </div>
                <select
                  value={selectedSecteur}
                  onChange={(e) => setSelectedSecteur(e.target.value)}
                  style={styles.select}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Tous les secteurs</option>
                  {getUniqueSecteurs().map(secteur => (
                    <option key={secteur} value={secteur}>
                      {secteur}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par lieu */}
              <div style={styles.filterGroup}>
                <div style={styles.filterLabel}>
                  📍 Filtrer par lieu
                </div>
                <select
                  value={selectedLieu}
                  onChange={(e) => setSelectedLieu(e.target.value)}
                  style={styles.select}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Tous les lieux</option>
                  {getUniqueLieuxForSecteur().map(lieu => (
                    <option key={lieu} value={lieu}>
                      {lieu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compteur de résultats */}
              {(selectedSecteur || selectedLieu) && (
                <span style={styles.resultCount}>
                  {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
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
            {selectedSecteur || selectedLieu ? 
              'Aucun compte rendu trouvé avec les filtres sélectionnés' : 
              'Aucune donnée disponible'
            }
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
                    {/* Badge */}
                    <div style={styles.badge}>
                      <div style={styles.badgeDot}></div>
                      Mécanisation
                    </div>

                    {/* Titre principal */}
                    <h3 style={styles.cardTitle}>
                      Compte rendu du {formatDate(item.date)}
                    </h3>

                    {/* ID */}
                    <p style={styles.cardId}>
                      N°{item.id}
                    </p>

                    {/* Chef d'équipe */}
                    <p style={styles.cardInfo}>
                      Chef d'équipe : {item['nom ce'] || 'Non spécifié'}
                    </p>

                    {/* Lieu et secteur avec badges */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={styles.locationBadge}>
                        📍 {item.lieu || 'Lieu non spécifié'}
                      </div>
                      <div style={styles.secteurBadge}>
                        🧭 {getSecteurFromData(item) || 'Secteur non défini'}
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <div style={styles.actionSection}>
                    {item['pdf url'] ? (
                      <a
                        href={item['pdf url']}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.viewButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                      >
                        Voir le résultat
                      </a>
                    ) : (
                      <button
                        disabled
                        style={{
                          ...styles.viewButton,
                          backgroundColor: '#f8fafc',
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          cursor: 'not-allowed'
                        }}
                      >
                        Non disponible
                      </button>
                    )}
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MecanisationReports;