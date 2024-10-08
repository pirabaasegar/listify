import { useEffect, useState, useRef } from 'react';
import { supabase } from './client';

function App() {
  const [listCode, setListCode] = useState('');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const codeInputRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, [listCode]);

  const fetchTasks = async (listCode = null) => {
    if (!listCode) {
      setTasks([]);
      setCompletedTasks([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('list_code', listCode);
      if (error) {
        throw error;
      }
      const uncomplete = data.filter(task => task.status === 'uncomplete');
      const completed = data.filter(task => task.status === 'completed');
      setTasks(uncomplete || []);
      setCompletedTasks(completed || []);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    }
  };

  const handleListCodeChange = (event) => {
    const newListCode = event.target.value;
    setListCode(newListCode);
    fetchTasks(newListCode);
  };

  const handleTaskInputChange = (event) => {
    setTaskInput(event.target.value);
  };

  const handleTaskCreate = async (event) => {
    if (event.key === 'Enter' && taskInput.trim() !== '') {
      try {
        let newListCode = '';
        if (!listCode) {
          newListCode = generateListCode();
          setListCode(newListCode);
        }

        const { data, error } = await supabase
          .from('todos')
          .insert([{ task: taskInput, list_code: listCode || newListCode, status: 'uncomplete' }]);
        if (error) {
          throw error;
        }
        setTaskInput('');
        fetchTasks(listCode || newListCode);
      } catch (error) {
        console.error('Error creating task:', error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    const currentDate = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(currentDate - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else {
      return date.toLocaleString('default', { month: 'short', day: 'numeric' });
    }
  };

  const handleTaskCheck = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'uncomplete' : 'completed';
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) {
        throw error;
      }
      fetchTasks(listCode);
    } catch (error) {
      console.error('Error updating task status:', error.message);
    }
  };

  const handleCopyCode = () => {
    codeInputRef.current.select();
    document.execCommand('copy');
  };

  const generateListCode = () => {
    const min = 10000000;
    const max = 99999999;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  };

  const [sampleTasks, setSampleTasks] = useState([
    { id: 1, task: 'Go buy groceries', due_date: 'Mar 12' },
    { id: 2, task: 'Clean room', due_date: 'Mar 19' },
    { id: 3, task: 'Finish essay', due_date: 'Mar 22' }
  ]);

  const handleDeleteSampleTask = (taskId) => {
    const updatedSampleTasks = sampleTasks.filter(task => task.id !== taskId);
    setSampleTasks(updatedSampleTasks);
  };

  return (
    <>
      <header className="header p-md-4" id="header">
        <div className="container d-flex justify-content-between gap-3 gap-md-0 align-items-center align-items-md-start flex-column flex-md-row">
          <div>
            <a className="navbar-brand fw-bold" href="/">
              <i className="bi bi-check-lg"></i>Listify
            </a>
          </div>
          <div className='codeContainer'>
            <input
              ref={codeInputRef}
              className='codeInput bg-transparent me-3 shadow-none'
              type='text'
              placeholder='Enter Your Code'
              value={listCode}
              onChange={handleListCodeChange}
            />
            <a href='#' onClick={handleCopyCode}><i className="bi bi-copy"></i></a>
          </div>
        </div>
      </header>
      <main className="main" id='main'>
        <div className="input-container">
          <input
            type="text"
            className="form-control mb-2 bg-transparent"
            placeholder="Search for or add Todo"
            value={taskInput}
            onChange={handleTaskInputChange}
            onKeyPress={handleTaskCreate}
          />
          <i className="bi bi-plus-lg position-absolute border-0 p-0 m-0 bg-transparent " />
        </div>
        <section className="uncomplete mt-5">
          <div className="section-header d-flex justify-content-between border-bottom border-secondary-subtle pb-2">
            <div className="section-header_left">
              <span className='me-3'>Todo</span>
              <span className='text-secondary'>{tasks.length} items</span>
            </div>
            <div className="section-header_right">
              <span className='text-secondary'>Due</span>
            </div>
          </div>
          <div className="section-body mt-3">
            <ul className="list-group gap-3">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <li key={task.id} className="list-group-item d-flex align-items-center justify-content-between bg-transparent border-0 p-0">
                    <div className='d-flex'>
                      <div className="form-check me-2">
                        <input
                          className="form-check-input position-relative rounded-circle bg-transparent"
                          type="checkbox"
                          onChange={() => handleTaskCheck(task.id, 'uncomplete')}
                          checked={false}
                        />
                      </div>
                      <span>{task.task}</span>
                    </div>
                    <span className='text-secondary'>{formatDate(task.due_date)}</span>
                  </li>
                ))
              ) : (
                <>
                  {sampleTasks.map(sampleTask => (
                    <li key={sampleTask.id} className="list-group-item d-flex align-items-center justify-content-between bg-transparent border-0 p-0">
                      <div className='d-flex'>
                        <div className="form-check me-2">
                          <input
                            className="form-check-input position-relative rounded-circle  bg-transparent"
                            type="checkbox"
                            onChange={() => handleDeleteSampleTask(sampleTask.id)}
                          />
                        </div>
                        <span>{sampleTask.task}</span>
                      </div>
                      <span className='text-secondary'>{formatDate(sampleTask.due_date)}</span>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </section>
        <section className="completed mt-5">
          <div className="section-header d-flex justify-content-between border-bottom border-secondary-subtle pb-2">
            <div className="section-header_left">
              <span className='me-3'>Completed</span>
              <span className='text-secondary'>{completedTasks.length} items</span>
            </div>
            <div className="section-header_right">
              <span className='text-secondary'>Due</span>
            </div>
          </div>
          <div className="section-body mt-3">
            <ul className="list-group gap-3">
              {completedTasks.map(task => (
                <li key={task.id} className="list-group-item d-flex align-items-center justify-content-between bg-transparent border-0 p-0">
                  <div className='d-flex'>
                    <div className="form-check me-2">
                      <input
                        className="form-check-input position-relative rounded-circle  bg-transparent"
                        type="checkbox"
                        onChange={() => handleTaskCheck(task.id, 'completed')}
                        checked={true}
                      />
                    </div>
                    <span className='text-decoration-line-through'>{task.task}</span>
                  </div>
                  <span className='text-secondary'>{formatDate(task.due_date)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <footer id="footer" className="footer w-100 position-absolute bottom-0">
        <div className="copyright text-center">
          © Copyright <strong><span>Listify</span></strong>. All Rights Reserved
        </div>
        <div className="credits text-center">
          Designed by <a href="https://www.pirabaa.ca/">Pirabaa</a>
        </div>
      </footer>
    </>
  );
}

export default App;