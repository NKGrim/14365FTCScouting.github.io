
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
    import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
    import {
      getFirestore,
      collection,
      addDoc,
      getDocs,
      query,
      orderBy,
      serverTimestamp,
      deleteDoc,
      updateDoc,
      doc
    } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

    const WRITE_PASSWORD = 'silverknights14365';

    const firebaseConfig = {
      apiKey: 'YAIzaSyD5O49GxXZm-dgMzwcSQtJvgiN-922rLxc',
      authDomain: 'ftcscouting-7d973.firebaseapp.com',
      projectId: 'ftcscouting-7d973',
      storageBucket: 'tcscouting-7d973.firebasestorage.app',
      messagingSenderId: '962743777529',
      appId: '1:962743777529:web:aac5e0be082935244fca28'
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const teamsList = document.getElementById('teams-list');
    const teamForm = document.getElementById('team-form');
    const teamInput = document.getElementById('team-input');
    const passwordInput = document.getElementById('write-password');
    const searchInput = document.getElementById('search-input');
    const updateRequestForm = document.getElementById('update-request-form');
    const requestTeamInput = document.getElementById('request-team-input');
    const requestInfoInput = document.getElementById('request-info-input');
    const viewRequestsButton = document.getElementById('view-requests-button');
    const requestsPanel = document.getElementById('requests-panel');
    const requestsList = document.getElementById('requests-list');

    let cachedTeams = [];
    let updateRequests = [];

    async function loadUpdateRequests() {
      const requestsQuery = query(collection(db, 'updateRequests'), orderBy('createdAt', 'desc'));
      const requestsSnap = await getDocs(requestsQuery);
      updateRequests = requestsSnap.docs.map(reqDoc => {
        const data = reqDoc.data();
        return {
          id: reqDoc.id,
          ...data,
          requestedAt: data.createdAt?.toDate?.()?.toLocaleString() || data.requestedAt || 'Unknown time'
        };
      });
    }

    async function resolveRequest(requestId) {
      if (!requireWritePassword()) return;
      setStatus('Resolving request...');
      await deleteDoc(doc(db, 'updateRequests', requestId));
      await loadUpdateRequests();
      renderUpdateRequests();
      setStatus('Request resolved.');
    }

    function setStatus(message) {
      // no-op: remove status display
    }

    function writeAllowed() {
      return passwordInput.value === WRITE_PASSWORD;
    }

    function requireWritePassword() {
      if (writeAllowed()) return true;
      alert('Enter the write password to modify data.');
      return false;
    }

    async function loadTeams() {
      teamsList.innerHTML = '';
      setStatus('Loading teams...');

      cachedTeams = [];
      const teamsQuery = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
      const teamsSnap = await getDocs(teamsQuery);

      if (teamsSnap.empty) {
        teamsList.innerHTML = '<li>No teams yet.</li>';
        setStatus('Loaded teams.');
        return;
      }

      for (const teamDoc of teamsSnap.docs) {
        const team = teamDoc.data();
        const teamId = teamDoc.id;

        const notesQuery = query(collection(db, 'teams', teamId, 'notes'), orderBy('createdAt', 'desc'));
        const notesSnap = await getDocs(notesQuery);
        const notes = notesSnap.docs.map(n => ({ id: n.id, ...n.data() }));

        cachedTeams.push({ id: teamId, ...team, notes });
      }

      renderTeams(cachedTeams);
      setStatus('Loaded teams.');
    }

    function renderTeams(list) {
      teamsList.innerHTML = '';
      if (!list.length) {
        teamsList.innerHTML = '<li>No teams found.</li>';
        return;
      }

      for (const t of list) {
        const teamId = t.id;
        const li = document.createElement('li');
      const header = document.createElement('div');
      header.className = 'team-header';

      const title = document.createElement('strong');
      title.textContent = t.name || '(unnamed)';

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'small collapse-btn';
      toggleBtn.textContent = '▼';
      toggleBtn.title = 'Collapse team';

      header.appendChild(title);
      header.appendChild(toggleBtn);
      li.appendChild(header);

      const teamContent = document.createElement('div');
      teamContent.className = 'team-content';

      const noteInput = document.createElement('input');
      noteInput.type = 'text';
      noteInput.placeholder = 'Add note to this team';
      noteInput.style.marginLeft = '0.5rem';

      const noteBtn = document.createElement('button');
      noteBtn.textContent = 'Add note';
      noteBtn.style.marginLeft = '0.5rem';
      noteBtn.addEventListener('click', async () => {
        if (!requireWritePassword()) return;
        const text = noteInput.value.trim();
        if (!text) return;
        setStatus('Saving note...');
        await addDoc(collection(db, 'teams', teamId, 'notes'), {
          text,
          createdAt: serverTimestamp()
        });
        noteInput.value = '';
        await loadTeams();
        setStatus('Saved.');
      });

      const delTeamBtn = document.createElement('button');
      delTeamBtn.textContent = 'Delete team';
      delTeamBtn.style.marginLeft = '0.5rem';
      delTeamBtn.addEventListener('click', async () => {
        if (!requireWritePassword()) return;
        await deleteTeam(teamId);
      });

      const teamActions = document.createElement('div');
      teamActions.style.display = 'flex';
      teamActions.style.flexWrap = 'wrap';
      teamActions.style.gap = '0.5rem';
      teamActions.appendChild(noteInput);
      teamActions.appendChild(noteBtn);
      teamActions.appendChild(delTeamBtn);
      teamContent.appendChild(teamActions);

        const notesUl = document.createElement('ul');
        if (!t.notes.length) {
          const emptyLi = document.createElement('li');
          emptyLi.textContent = 'No notes for this team.';
          notesUl.appendChild(emptyLi);
        } else {
          for (const note of t.notes) {
            const noteLi = document.createElement('li');
            const textSpan = document.createElement('span');
            textSpan.textContent = note.text || 'Empty note';
            noteLi.appendChild(textSpan);

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginLeft = '0.5rem';
            noteLi.appendChild(editBtn);

            const del = document.createElement('button');
            del.textContent = 'Delete';
            del.style.marginLeft = '0.75rem';
            noteLi.appendChild(del);

            editBtn.addEventListener('click', () => {
              const editInput = document.createElement('input');
              editInput.type = 'text';
              editInput.value = note.text || '';
              noteLi.insertBefore(editInput, textSpan);
              noteLi.removeChild(textSpan);
              editBtn.style.display = 'none';
              del.style.display = 'none';

              const saveBtn = document.createElement('button');
              saveBtn.textContent = 'Save';
              saveBtn.style.marginLeft = '0.5rem';
              const cancelBtn = document.createElement('button');
              cancelBtn.textContent = 'Cancel';
              cancelBtn.style.marginLeft = '0.25rem';

              saveBtn.addEventListener('click', async () => {
                if (!requireWritePassword()) return;
                const newText = editInput.value.trim();
                if (!newText) return;
                setStatus('Saving...');
                await updateDoc(doc(db, 'teams', teamId, 'notes', note.id), {
                  text: newText,
                  updatedAt: serverTimestamp()
                });
                await loadTeams();
                setStatus('Saved.');
              });

              cancelBtn.addEventListener('click', () => {
                noteLi.insertBefore(textSpan, editInput);
                noteLi.removeChild(editInput);
                editBtn.style.display = '';
                del.style.display = '';
                saveBtn.remove();
                cancelBtn.remove();
              });

              noteLi.appendChild(saveBtn);
              noteLi.appendChild(cancelBtn);
            });

            del.addEventListener('click', async () => {
              if (!requireWritePassword()) return;
              setStatus('Deleting note...');
              await deleteDoc(doc(db, 'teams', teamId, 'notes', note.id));
              await loadTeams();
              setStatus('Note deleted.');
            });

            notesUl.appendChild(noteLi);
          }
        }

      teamContent.appendChild(notesUl);
      li.appendChild(teamContent);
      teamsList.appendChild(li);

      toggleBtn.addEventListener('click', () => {
        const collapsed = teamContent.style.display === 'none';
        teamContent.style.display = collapsed ? '' : 'none';
        toggleBtn.textContent = collapsed ? '▼' : '▶';
        toggleBtn.title = collapsed ? 'Collapse team' : 'Expand team';
      });
    }
  }

    async function deleteTeam(teamId) {
      if (!requireWritePassword()) return;
      if (!confirm('Delete this team and all its notes? This cannot be undone.')) return;
      setStatus('Deleting team...');
      const notesQuery = query(collection(db, 'teams', teamId, 'notes'), orderBy('createdAt', 'desc'));
      const notesSnap = await getDocs(notesQuery);
      const deletes = notesSnap.docs.map(noteDoc => deleteDoc(doc(db, 'teams', teamId, 'notes', noteDoc.id)));
      await Promise.all(deletes);
      await deleteDoc(doc(db, 'teams', teamId));
      await loadTeams();
      setStatus('Team deleted.');
    }

    teamForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!requireWritePassword()) return;
      const name = teamInput.value.trim();
      if (!name) return;

      setStatus('Creating team...');
      await addDoc(collection(db, 'teams'), {
        name,
        createdAt: serverTimestamp()
      });

      teamInput.value = '';
      await loadTeams();
      setStatus('Team created.');
    });

    updateRequestForm.addEventListener('submit', async event => {
      event.preventDefault();
      const teamName = requestTeamInput.value.trim();
      const requestedInfo = requestInfoInput.value.trim();
      if (!teamName || !requestedInfo) {
        alert('Please enter a team name/number and requested information.');
        return;
      }

      setStatus('Saving request...');
      await addDoc(collection(db, 'updateRequests'), {
        teamName,
        requestedInfo,
        createdAt: serverTimestamp()
      });

      requestTeamInput.value = '';
      requestInfoInput.value = '';

      if (passwordInput.value === WRITE_PASSWORD) {
        await loadUpdateRequests();
        requestsPanel.style.display = 'block';
        renderUpdateRequests();
      } else {
        alert('Request submitted. Use the write password above to view all requested updates.');
      }
    });

    viewRequestsButton.addEventListener('click', async () => {
      if (passwordInput.value !== WRITE_PASSWORD) {
        alert('Invalid write key.');
        return;
      }

      await loadUpdateRequests();
      requestsPanel.style.display = 'block';
      renderUpdateRequests();
    });

    function renderUpdateRequests() {
      requestsList.innerHTML = '';
      if (!updateRequests.length) {
        requestsList.innerHTML = '<li class="meta">No requested updates yet.</li>';
        return;
      }

      for (const update of updateRequests) {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        title.textContent = update.teamName;
        li.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `Requested at ${update.requestedAt}`;
        li.appendChild(meta);

        const info = document.createElement('div');
        info.textContent = update.requestedInfo;
        li.appendChild(info);

        const actions = document.createElement('div');
        actions.style.marginTop = '0.75rem';

        const resolveBtn = document.createElement('button');
        resolveBtn.textContent = 'Resolve';
        resolveBtn.className = 'small';
        resolveBtn.addEventListener('click', async () => {
          await resolveRequest(update.id);
        });

        actions.appendChild(resolveBtn);
        li.appendChild(actions);
        requestsList.appendChild(li);
      }
    }

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) return renderTeams(cachedTeams);
      const filtered = cachedTeams.filter(t => (t.name || '').toLowerCase().includes(q));
      renderTeams(filtered);
    });

    signInAnonymously(auth)
      .then(() => setStatus('Connected anonymously to Firebase.'))
      .catch(error => setStatus('Firebase auth error: ' + error.message));

    loadTeams().catch(error => setStatus('Error loading teams: ' + error.message));
  