import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to backend
const socket = io('http://localhost:4000');

// Fake Devices List
const MOCK_DEVICES = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Device-Node-${i + 1}`,
  ip: `192.168.1.${100 + i}`
}));

function App() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [finishedCount, setFinishedCount] = useState(0);
  const [jobId, setJobId] = useState(null); // Make sure you track the current Job ID


  useEffect(() => {
    socket.on('ping-progress', (data) => {
      setDeviceStatuses(prev => ({
        ...prev,
        [data.deviceId]: data.status
      }));
      setFinishedCount(prev => prev + 1);
    });

    return () => socket.off('ping-progress');
  }, []);

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleStartPing = async () => {
    if (selectedIds.size === 0) return;

    // Reset State
    setDeviceStatuses({});
    setFinishedCount(0);
    setIsModalOpen(true);

    // Call API
    try {
      const res = await fetch('http://localhost:4000/api/start-ping-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds: Array.from(selectedIds) })
      });
      const data = await res.json();

      // Join specific job room
      setJobId(data.jobId); // <--- SAVE THIS ID
      socket.emit('join-job-room', data.jobId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    // 1. Send cancel signal if job is not finished
    if (finishedCount < selectedIds.size && jobId) {
      console.log("Cancelling job:", jobId);
      socket.emit('cancel-job', jobId);
    }

    // 2. Close UI
    setIsModalOpen(false);
    setJobId(null); // Reset ID
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Network Pinger Demo</h1>

      <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
        {/* List */}
        <div style={{ flex: 1, border: '1px solid #ddd', overflowY: 'auto', padding: '10px' }}>
          {MOCK_DEVICES.map(d => (
            <div
              key={d.id}
              onClick={() => toggleSelection(d.id)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: selectedIds.has(d.id) ? '#e6f7ff' : 'white',
                borderBottom: '1px solid #eee'
              }}
            >
              <input type="checkbox" checked={selectedIds.has(d.id)} readOnly style={{ marginRight: '10px' }} />
              {d.name} <span style={{ color: '#888', fontSize: '0.9em' }}>({d.ip})</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ width: '200px' }}>
          <button
            onClick={handleStartPing}
            disabled={selectedIds.size === 0}
            style={{
              width: '100%', padding: '15px',
              background: selectedIds.size > 0 ? '#007bff' : '#ccc',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            PING SELECTED ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: '20px', width: '400px', borderRadius: '8px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2>Ping Status</h2>
            <div style={{ marginBottom: '10px' }}>Progress: {finishedCount} / {selectedIds.size}</div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', marginBottom: '10px' }}>
              {Array.from(selectedIds).map(id => {
                const status = deviceStatuses[id] || 'pending';
                const device = MOCK_DEVICES.find(d => d.id === id);
                return (
                  <div key={id} style={{ padding: '8px', borderBottom: '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{device.name}</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: status === 'success' ? 'green' : status === 'failed' ? 'red' : 'orange'
                    }}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleCloseModal} // <--- USE NEW HANDLER
              style={{ padding: '10px', float: 'right' }}
            >
              {finishedCount < selectedIds.size ? 'Cancel & Close' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;