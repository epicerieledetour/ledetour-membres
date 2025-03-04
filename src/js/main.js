'use strict';

(async function () {
  const ELEMENT_ID_EXCEPTION = "exception"
  const ELEMENT_ID_KEYBOARD = "keyboard"
  const ELEMENT_ID_MEMBER = "member"
  const ELEMENT_ID_MEMBER_ACTIVE = "member-active"
  const ELEMENT_ID_MEMBER_HOURS = "member-hours"
  const ELEMENT_ID_MEMBER_NAME = "member-name"
  const ELEMENT_ID_MEMBER_PHONE = "member-phone"
  const ELEMENT_ID_PRIVATE = "private"
  const ELEMENT_ID_SEARCH = "search"
  const ELEMENT_ID_UPDATED_AT = "updated-at"
  const ELEMENT_ID_CYCLE_END = "cycle-end-time"

  const MEMBERS_DATA_URL = '/members.json'
  const FETCH_STATUS_FETCHING = 'fetching'
  const FETCH_STATUS_READY = 'ready'
  const FETCH_STATUS_ERROR = 'error'

  let members = null

  function setFetchingStatus(status) {
    document.body.dataset.fetchingStatus = status
  }

  function setMembersData(membersData) {
    setPrivateData(!!membersData.contains_private_data)
    setUpdateDate(membersData.updated_at)
    setCycleEndDate(membersData.cycle_end)
    members = membersData.members
  }

  // format and options are optional
  // For toLocaleString arguments see https://stackoverflow.com/questions/2388115/get-locale-short-date-format-using-javascript

  function setDate(dateISOString, element, format, options) {
    const el = document.getElementById(element)
    el.datetime = dateISOString
    const date = new Date(dateISOString)

    if (format && options) el.innerText = date.toLocaleString(format, options)
    else el.innerText = date.toLocaleString()
    return date
  }

  function setPrivateData(containsPrivateData) {
    document.getElementById(ELEMENT_ID_PRIVATE).dataset.private = containsPrivateData
  }

  function setUpdateDate(dateISOString) {
    const date = setDate(dateISOString, ELEMENT_ID_UPDATED_AT)
    console.log(`Last update: ${date}`)
  }

  function setCycleEndDate(dateISOString) {
    const locale = "fr-CA"
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }

    const date = setDate(dateISOString, ELEMENT_ID_CYCLE_END, locale, options)
    console.log(`Cycle end date: ${date}`)
  }

  function setExceptionMessage(exception) {
    document.getElementById(ELEMENT_ID_EXCEPTION).innerText = exception.message
  }

  async function fetchMembersData(membersDataUrl) {
    const resp = await fetch(MEMBERS_DATA_URL)
    if (resp.ok) {
      return await resp.json()
    }
    throw new Error(`${resp.url} failed with status ${resp.status}: ${resp.statusText}`)
  }

  function showMember(member) {
    let status = ""
    let hours = ""
    let name = ""
    let phone = ""
    if (member) {
      status = member.active
      if (member.hours_in_bank !== undefined) {
        hours = "(" + member.hours_in_bank + " heures)"
      }
      phone = member.phone || ""

      const firstName = member.first_name
      const familyName = member.family_name
      if (!!(firstName && familyName)) {
        name = `${firstName} ${familyName}`
      }
    }

    document.getElementById(ELEMENT_ID_MEMBER).dataset.status = status
    document.getElementById(ELEMENT_ID_MEMBER_HOURS).innerText = hours
    document.getElementById(ELEMENT_ID_MEMBER_NAME).innerText = name
    document.getElementById(ELEMENT_ID_MEMBER_PHONE).innerText = phone
  }

  async function updateMembersData() {
    setFetchingStatus(FETCH_STATUS_FETCHING)
    try {
      setMembersData(await fetchMembersData(MEMBERS_DATA_URL))
      setFetchingStatus(FETCH_STATUS_READY)
    }
    catch (e) {
      setFetchingStatus(FETCH_STATUS_ERROR)
      setExceptionMessage(e)
      throw e
    }
  }

  function appendValueToMemberSearchField(value) {
    const el = document.getElementById(ELEMENT_ID_SEARCH)
    el.value += value
  }

  function resetMemberSearchField() {
    const el = document.getElementById(ELEMENT_ID_SEARCH)
    el.value = ""
  }

  function handleVirtualKeyboardKeyPress(ev) {
    const value = ev.target.dataset.value;
    if (value == 'cancel' || value == 'done') {
      resetMemberSearchField();
    } else {
      appendValueToMemberSearchField(value);
    }
    updateMemberView()
  }

  function updateMemberView() {
    const memberId = document.getElementById(ELEMENT_ID_SEARCH).value
    const member = members[memberId] || null
    showMember(member)
  }

  //

  document.getElementById(ELEMENT_ID_SEARCH).addEventListener("input", updateMemberView)

  for (const key of document.getElementById(ELEMENT_ID_KEYBOARD).children) {
    key.addEventListener("click", handleVirtualKeyboardKeyPress)
  }

  await updateMembersData()
})()
