import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  window.location.href = "login.html";
}

const titleEl = document.getElementById('linksIn');
const allLinks = document.querySelectorAll('ul > li');
const dashiitemEl = document.querySelectorAll('.dashitem');
const welcomeMessage = document.querySelector('.welcome-message');
const addAssignment = document.querySelector('.assignment');
const titleElLink = document.getElementById('title');
const discription = document.getElementById('des')
const course = document.getElementById('course');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const low = document.getElementById('low');
const medium = document.getElementById('medium')
const high = document.getElementById('high');
const assignmentadd = document.querySelector('.Assignment');
const firstName = document.getElementById('firstName')
const lastName = document.getElementById('lastName');
const departmnent = document.getElementById('department')
const email = document.getElementById('email');

let userEmail = '';

const result = JSON.parse(sessionStorage.getItem('keyInfomation')) 
console.log(result)

if(result === null){
  const signUpResult = JSON.parse(sessionStorage.getItem('userProfile'));
  welcomeMessage.textContent = `Welcome ${signUpResult.first_name} ${signUpResult.last_name}`
  firstName.value = signUpResult.first_name;
  lastName.value = signUpResult.last_name;
  departmnent.value = signUpResult.department;
  email.value = signUpResult.email;
  userEmail = signUpResult.email;
} else {
  console.log(result);
  welcomeMessage.textContent = `Welcome ${result[0].first_name} ${result[0].last_name}`
  firstName.value = result[0].first_name;
  lastName.value = result[0].last_name;
  departmnent.value = result[0].department;
  email.value = result[0].email;
  userEmail = result[0].email;
}

const assignmentdefault = document.querySelector('.noAssignment')

// Fetch reminders from Supabase
async function fetchRemindersFromSupabase() {
  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_sent', false)
      .order('deadline', { ascending: true });

    if (error) throw error;
    
    console.log('Fetched reminders:', reminders);
    return reminders || [];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
}

// Save reminder to Supabase
async function saveReminderToSupabase(assignment) {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert([
        {
          user_id: session.user.id,
          user_email: userEmail,
          title: assignment.title,
          description: assignment.description,
          course: assignment.course,
          deadline: assignment.datetime,
          priority: assignment.piority,
          is_sent: false
        }
      ])
      .select();

    if (error) throw error;
    console.log('Reminder saved:', data);
    return data;
  } catch (error) {
    console.error('Error saving reminder:', error);
    alert('Failed to save reminder. Please try again.');
    return null;
  }
}

addAssignment.addEventListener('click', async (e) => {
  e.preventDefault()
  
  const titlevalue = titleElLink.value;
  const discriptionValue = discription.value;
  const courseValue = course.value;
  const dateValue = dateEl.value;
  const timeValue = timeEl ? timeEl.value : '09:00';
  const getpiority = piorityDetermination();
  
  // Combine date and time in ISO format
  const datetime = `${dateValue}T${timeValue}:00`;
  
  const allValues = {
    title: titlevalue,
    description: discriptionValue,
    course: courseValue,
    date: dateValue,
    time: timeValue,
    datetime: datetime,
    piority: getpiority
  }

  if(!validation()){
    alert('Invalid user input. Please Check and try again')
    return;
  }
  
  // Save to Supabase
  const saved = await saveReminderToSupabase(allValues);
  
  if (saved) {
    // Clear form
    titleElLink.value = '';
    discription.value = '';
    course.value = '';
    dateEl.value = '';
    if(timeEl) timeEl.value = '';
    low.checked = false;
    medium.checked = false;
    high.checked = false;
    
    // Refresh display
    await displayAssignments();
    
    alert('Assignment added! You will receive an email reminder when the deadline is reached.');
  }
})

function piorityDetermination(){
  let piority;
  if(low.checked){
    piority = 'low';
  } else if(medium.checked){
    piority = 'medium'
  } else if(high.checked){
    piority = 'high'
  } else {
    piority = null;
  }
  return piority;
}

function validation(){
  const titlevalue = titleElLink.value;
  const discriptionValue = discription.value;
  const courseValue = course.value;
  const dateValue = dateEl.value;
  const getpiority = piorityDetermination();
  
  if(titlevalue.length < 2 || discriptionValue.length < 2 || courseValue.length < 2 || !getpiority || dateValue === ''){
    return false;
  }
  return true;
}

// Display assignments from Supabase
async function displayAssignments() {
  const reminders = await fetchRemindersFromSupabase();
  
  if(reminders.length === 0){
    assignmentdefault.textContent = 'No upcoming Assignment. Click add Assignment to schedule your time';
    assignmentdefault.style.display = 'block';
    assignmentadd.innerHTML = '';
  } else {
    assignmentdefault.style.display = 'none';
    assignmentadd.innerHTML = `
      <h1 style='padding-bottom: 2rem;'>Upcoming Assignments</h1>
      ${reminders.map((reminder) => {
        const deadlineDate = new Date(reminder.deadline);
        const formattedDate = deadlineDate.toLocaleDateString();
        const formattedTime = deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return ` <div class='each-title'>
          <div><span>Title:</span> ${reminder.title}</div>
          <div><span>Course:</span> ${reminder.course}</div>
          <div><span>Description:</span> ${reminder.description}</div>
          <div><span>Deadline:</span> ${formattedDate} at ${formattedTime}</div>
          <div><span>Priority:</span> <span style="color: ${
            reminder.priority === 'high' ? 'red' : 
            reminder.priority === 'medium' ? 'orange' : 'green'
          }; font-weight: bold;">${reminder.priority}</span></div>
          <div style="margin-top:1rem; display:flex; gap:10px;">
            <button onclick="deleteAssignment('${reminder.id}')" style="background: #dc3545; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
          </div>
        </div>`
      }).join('')}`
  }
}

// Delete assignment from Supabase
async function deleteAssignment(reminderId) {
  if (!confirm('Are you sure you want to delete this assignment?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', session.user.id);
    
    if (error) throw error;
    
    console.log('Reminder deleted successfully');
    await displayAssignments();
  } catch (error) {
    console.error('Error deleting reminder:', error);
    alert('Failed to delete reminder. Please try again.');
  }
}

// Make function globally accessible
window.deleteAssignment = deleteAssignment;

// Initial display
displayAssignments();

// Check for due reminders every minute
setInterval(checkReminders, 60000);

// Also check immediately on page load
checkReminders();

async function checkReminders() {
  try {
    const now = new Date();
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_sent', false);
    
    if (error) throw error;
    
    for (const reminder of reminders || []) {
      const reminderTime = new Date(reminder.deadline);
      if (now >= reminderTime) {
        await sendEmailNotification(reminder);
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

async function sendEmailNotification(reminder) {
  try {
    console.log('Sending email for reminder:', reminder.title);
    
    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-reminder-email', {
      body: {
        email: reminder.user_email,
        title: reminder.title,
        course: reminder.course,
        description: reminder.description,
        deadline: reminder.deadline
      }
    });
    
    if (error) {
      console.error('Error calling edge function:', error);
      return;
    }
    
    console.log('Email sent successfully:', data);
    
    // Mark as sent
    await supabase
      .from('reminders')
      .update({ is_sent: true })
      .eq('id', reminder.id);
    
    // Delete the reminder after email is sent
    await supabase
      .from('reminders')
      .delete()
      .eq('id', reminder.id);
    
    console.log('Reminder deleted after email sent');
    
    // Refresh the display
    await displayAssignments();
    
    // Show notification to user
    if (Notification.permission === 'granted') {
      new Notification('Assignment Reminder', {
        body: `${reminder.title} is due now!`,
        icon: '/favicon.ico'
      });
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

// Request notification permission
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Calendar code
let currentDate = new Date();
let selectedDate = null;
let events = {};

const months = ['January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December'];

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  document.getElementById('monthYear').textContent = `${months[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'day empty';
    calendar.appendChild(emptyDay);
  }
  
  const today = new Date();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    
    const isToday = day === today.getDate() && 
                   month === today.getMonth() && 
                   year === today.getFullYear();
    
    if (isToday) {
      dayDiv.classList.add('today');
    }
    
    dayDiv.innerHTML = `<div class="day-number">${day}</div><div class="events" id="events-${year}-${month}-${day}"></div>`;
    dayDiv.onclick = () => openModal(year, month, day);
    calendar.appendChild(dayDiv);
    renderEvents(year, month, day);
  }
}

function renderEvents(year, month, day) {
  const key = `${year}-${month}-${day}`;
  const eventsContainer = document.getElementById(`events-${key}`);
  
  if (eventsContainer && events[key]) {
    eventsContainer.innerHTML = '';
    events[key].forEach((event, index) => {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event';
      eventDiv.textContent = event.time ? `${event.time} ${event.title}` : event.title;
      eventDiv.onclick = (e) => {
        e.stopPropagation();
        deleteEvent(key, index);
      };
      eventsContainer.appendChild(eventDiv);
    });
  }
}

function openModal(year, month, day) {
  selectedDate = { year, month, day };
  document.getElementById('modalTitle').textContent = `Add Event - ${months[month]} ${day}, ${year}`;
  document.getElementById('eventModal').classList.add('active');
  document.getElementById('eventTitle').focus();
}

function closeModal() {
  document.getElementById('eventModal').classList.remove('active');
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventTime').value = '';
}

function saveEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const time = document.getElementById('eventTime').value;
  
  if (!title) return;
  
  const key = `${selectedDate.year}-${selectedDate.month}-${selectedDate.day}`;
  
  if (!events[key]) {
    events[key] = [];
  }
  
  events[key].push({ title, time });
  renderEvents(selectedDate.year, selectedDate.month, selectedDate.day);
  closeModal();
}

function deleteEvent(key, index) {
  if (confirm('Delete this event?')) {
    events[key].splice(index, 1);
    if (events[key].length === 0) {
      delete events[key];
    }
    const parts = key.split('-');
    renderEvents(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  }
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function today() {
  currentDate = new Date();
  renderCalendar();
}

document.getElementById('eventTitle')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveEvent();
});

renderCalendar();

allLinks.forEach((el) => {
  el.addEventListener('click', (e) => {
    allLinks.forEach((els) => {
      els.classList.remove('active');
    })
    dashiitemEl.forEach((element) => {
      element.style.display = 'none'
    })
    e.target.classList.add('active');
    const refinedText = e.target.innerText.trim();
    titleEl.textContent = refinedText;
    determineWhatWillbeinBody();
  })
})

function determineWhatWillbeinBody(){
  let titleElValue = titleEl.textContent;
  console.log(titleElValue);
  switch(titleElValue){
    case 'Profile':
      dashiitemEl[0].style.display = 'block';
      break;
    case 'Reminder':
      dashiitemEl[1].style.display = 'block';
      displayAssignments(); // Refresh reminders when viewing
      break;
    case 'Add Assign':
      dashiitemEl[2].style.display = 'block';
      break;
    case 'Calender':
      dashiitemEl[3].style.display = 'block';
      break;
    default:
      dashiitemEl.forEach((el) => {
        el.style.display = 'none'
      });
  }
}