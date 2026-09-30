/**
 * Builds the Indusequine professional intake form.
 *
 * Coaches, vets and farriers fill this in so we can list them under Services.
 * The questions follow what /services already promises a rider will see and
 * what we say we verify, so nothing is collected that the page cannot show and
 * nothing the page claims is missing.
 *
 * TO INSTALL
 *   1. Go to script.google.com, New project.
 *   2. Paste this file in, replacing anything there.
 *   3. Run > buildIntakeForm. Google will ask for permission to create forms.
 *   4. The log prints two links: the form to send, and its edit page.
 *   5. In the form's editor, Responses > link to a spreadsheet.
 *
 * Re-running makes a second form; it does not update the first. Edit questions
 * here and rebuild while nobody has answered, or edit in the form itself once
 * people have.
 *
 * No file-upload questions on purpose: Google makes the respondent sign in to a
 * Google account to attach anything, which is a wall for someone opening a
 * WhatsApp link on a phone. Certificates and work photos are asked for over
 * WhatsApp instead, which is where these conversations already happen.
 */

var TITLE = 'Indusequine — Professional Listing';

var INTRO = [
  'Indusequine is building one place where Indian riders can find coaches, equine vets and farriers.',
  '',
  'This takes about five minutes. It is how your profile gets written, so the more you tell us, the better we can send you the right riders.',
  '',
  'Listing is free. We verify what you tell us before anything goes live, and we will come back to you before your profile is published.',
  '',
  'Your rates stay private. We never show a number on your profile — it says "on request", and we only discuss your fee when a rider asks and you have agreed.',
].join('\n');

var FEE_NOTE = 'Your rates are not shown on your profile. It says "on request". ' +
  'We ask so we can match you with riders whose budget fits, and so we are not ' +
  'putting you in front of people who were never going to book you. Nothing is ' +
  'shared without your say-so.';

var REF_NOTE = 'We call references before a profile goes live. Please tell them ' +
  'to expect us.';


function buildIntakeForm() {
  var form = FormApp.create(TITLE);
  form.setDescription(INTRO);
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage(
    'Thank you. We will verify your details and come back to you before your ' +
    'profile goes live. If we need a certificate or photographs of your work, ' +
    'we will ask on WhatsApp.');

  // ---- who they are, asked of everyone -------------------------------------
  text(form, 'Full name', true);
  text(form, 'WhatsApp number', true,
       'This is how we will reach you, and how we will ask for certificates '
       + 'and photographs of your work.');
  text(form, 'Email address', true);
  text(form, 'Which city and state are you based in?', true);
  text(form, 'Which languages do you work in?', true,
       'For example: English, Hindi, Marathi. Riders filter by this.');
  text(form, 'How many years have you worked with horses?', true);

  // The question that sends each trade down its own page. Its choices point at
  // pages that do not exist yet, so it is created here and answered at the end.
  var role = form.addMultipleChoiceItem()
    .setTitle('What do you do?')
    .setHelpText('If you do more than one, pick the main one and tell us the ' +
                 'rest at the end. We will send you a second form.')
    .setRequired(true);

  // Items are appended, so each page has to be finished before the next one
  // starts. Building all four page breaks first would put every question after
  // the last of them.
  var coachPage = form.addPageBreakItem().setTitle('Coaching');
  buildCoach(form);

  var vetPage = form.addPageBreakItem().setTitle('Veterinary practice');
  buildVet(form);

  var farrierPage = form.addPageBreakItem().setTitle('Farriery');
  buildFarrier(form);

  var lastPage = form.addPageBreakItem().setTitle('Before you send this');
  buildClosing(form);

  role.setChoices([
    role.createChoice('Riding coach or instructor', coachPage),
    role.createChoice('Equine vet', vetPage),
    role.createChoice('Farrier', farrierPage),
  ]);

  // Without this each trade would fall through into the next one's questions.
  coachPage.setGoToPage(lastPage);
  vetPage.setGoToPage(lastPage);
  farrierPage.setGoToPage(lastPage);

  Logger.log('Send this to professionals: ' + form.getPublishedUrl());
  Logger.log('Edit it here: ' + form.getEditUrl());
}


function buildCoach(form) {
  checkboxes(form, 'Which disciplines do you teach?', true, [
    'Dressage', 'Show jumping', 'Eventing', 'Polo', 'Endurance',
    'Vaulting', 'Hacking and general riding', 'Tent pegging',
  ], true);

  checkboxes(form, 'Who do you teach?', true, [
    'Complete beginners, first time on a horse',
    'Club level riders',
    'National level competitors',
    'International level competitors',
  ]);

  checkboxes(form, 'Which age groups?', true, [
    'Children under 12', 'Teenagers', 'Adults',
  ]);

  para(form, 'Which stables or riding schools do you teach at?', true,
       'Name and city for each. If you travel to riders, say so here.');

  text(form, 'Do you own your own club or riding school?', true,
       'If you do, tell us what it is called. If not, just say no.');

  choice(form, 'Can client horses be stabled where you teach?', true,
         ['Yes', 'No', 'At some of the places I teach'],
         'Riders looking to move a horse ask this first.');

  para(form, 'What are your qualifications?', true,
       'For example BHS Stage 3, FEI Level 1, EFI or IEF licence, NIS ' +
       'certification, or an army or police riding qualification. Please give ' +
       'the level and the year for each. If you learned by riding rather than ' +
       'by certificate, say that — it is not a disqualification and we would ' +
       'rather know.');

  text(form, 'What do you charge for a private lesson?', true, FEE_NOTE);
  text(form, 'And for a group lesson, or a monthly or package rate?', false);

  choice(form, 'Do you travel to other stables to teach?', true, ['Yes', 'No']);

  para(form, 'Two students or parents we can speak to', true,
       'Name and phone number for each, and at least two please. A coach is judged by the riders they have taught, and this is the part riders trust most. ' + REF_NOTE);
}


function buildVet(form) {
  para(form, 'What are your veterinary qualifications?', true,
       'Degree, university and year. For example BVSc & AH, then MVSc in ' +
       'Surgery. Include any equine specialisation.');

  choice(form, 'Do you work with horses full time?', true,
         ['Yes, equine only', 'Mostly horses, some other animals',
          'Mixed practice, horses are part of it']);

  checkboxes(form, 'What do you do for horses?', true, [
    'Vaccination and routine preventive care',
    'Deworming and parasite management',
    'Dentistry',
    'Nutrition advice',
    'Lameness workups and gait analysis',
    'Joint injections and performance medicine',
    'Pre-purchase examinations',
    'Surgery',
    'Reproduction and breeding work',
    'Emergency and critical care',
  ], true);

  choice(form, 'Do you take emergency calls?', true,
         ['Yes, any hour', 'Yes, during daylight hours',
          'Only for stables I already work with', 'No']);

  text(form, 'How quickly can you usually reach a horse in an emergency?', false,
       'An honest answer helps more than an optimistic one.');

  text(form, 'Which areas do you cover?', false,
       'Districts, or a distance from your base.');

  choice(form, 'Do you work from a clinic, or do you travel?', true,
         ['Clinic only', 'I travel to the horse', 'Both']);

  text(form, 'What do you charge for a routine consultation or farm visit?', true, FEE_NOTE);
  text(form, 'And for a call-out or an emergency?', false);

  para(form, 'Two stables or owners we can speak to', false,
       'Name and phone number for each. ' + REF_NOTE);
}


function buildFarrier(form) {
  checkboxes(form, 'What kind of work do you do?', true, [
    'Hot shoeing', 'Cold shoeing', 'Corrective and therapeutic shoeing',
    'Barefoot trimming', 'Making shoes from stock',
  ], true);

  checkboxes(form, 'Which horses do you work with most?', true, [
    'Sport horses, jumping and dressage',
    'Polo ponies',
    'Racehorses',
    'Marwari, Kathiawari and other indigenous breeds',
    'Foals and young horses',
    'Horses needing remedial work',
  ], true);

  para(form, 'How did you learn farriery?', true,
       'Who did you apprentice under and for how long, or which course did you ' +
       'do. Most good farriers in India learned on the anvil rather than in a ' +
       'classroom, and that is what we want to hear about.');

  text(form, 'Roughly how many horses do you shoe in a month?', true);

  text(form, 'Which areas do you travel to?', false,
       'Cities, or a distance from your base.');

  text(form, 'How far ahead do you need to be booked?', false,
       'For example: two days, or a week in season.');

  text(form, 'How much do you charge per horse for shoeing?', true, FEE_NOTE);
  text(form, 'And for a trim, or for remedial work?', false);
  text(form, 'Do you charge for travel? How much?', false);

  para(form, 'Two stables we can speak to', false,
       'Name and phone number for each. We ask farriers for two because a ' +
       'stable knows within a month whether the shoeing is holding. ' + REF_NOTE);
}


function buildClosing(form) {
  para(form, 'Anything else riders should know about you?', false,
       'Competition results, the horses you have worked with, what you are ' +
       'known for. Write as much or as little as you like.');

  choice(form, 'May we list you on Indusequine once we have verified your details?', true,
         ['Yes', 'I would like to see my profile first']);


  photos(form);

  form.addSectionHeaderItem()
    .setTitle('One more thing')
    .setHelpText('If you have certificates or licences, send them to us on ' +
                 'WhatsApp on the number we contacted you from.');
}


/**
 * The photographs question.
 *
 * Apps Script has been able to read answers to a file-upload question for
 * years without being able to create one. If that is still true this throws,
 * and the log says what to add by hand rather than leaving a form that quietly
 * asks for nothing.
 */
function photos(form) {
  var title = 'Photographs of you and your work';
  var help = 'As many as you like. A picture of you riding or teaching, your ' +
    'work, your stable, your horses. This is the single thing that decides ' +
    'whether a rider stops at your profile, and a listing without one gets ' +
    'passed over. If you would rather send them on WhatsApp, that is fine too.';

  try {
    form.addFileUploadItem()
      .setTitle(title)
      .setHelpText(help)
      .setRequired(false);
    Logger.log('Photo upload question added.');
  } catch (e) {
    form.addParagraphTextItem()
      .setTitle(title)
      .setHelpText(help + ' Paste a link here, or just say you will send them ' +
                   'on WhatsApp.')
      .setRequired(false);
    Logger.log('COULD NOT create a file-upload question: ' + e.message);
    Logger.log('A text box asking for a link was put in its place. To take ' +
               'real uploads, open the form, find "' + title + '", and change ' +
               'its type to File upload. Set it to images only and allow up to ' +
               '10 files. Google will ask you to confirm that respondents must ' +
               'sign in to a Google account.');
  }
}


// ---- small helpers, so the questions above read as questions ---------------

function text(form, title, required, help) {
  var q = form.addTextItem().setTitle(title).setRequired(!!required);
  if (help) q.setHelpText(help);
  return q;
}

function para(form, title, required, help) {
  var q = form.addParagraphTextItem().setTitle(title).setRequired(!!required);
  if (help) q.setHelpText(help);
  return q;
}

function choice(form, title, required, options, help) {
  var q = form.addMultipleChoiceItem().setTitle(title)
    .setChoiceValues(options).setRequired(!!required);
  if (help) q.setHelpText(help);
  return q;
}

function checkboxes(form, title, required, options, allowOther) {
  var q = form.addCheckboxItem().setTitle(title)
    .setChoiceValues(options).setRequired(!!required);
  if (allowOther) q.showOtherOption(true);
  return q;
}
