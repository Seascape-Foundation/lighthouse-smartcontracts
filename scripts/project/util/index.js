let lastId = async function (project) {
  try {
    let amount = await project.totalProjects();
    return parseInt(amount.toString());
  } catch (error) {
    console.error(error);
    throw `Failed to fetch the result`;
  }
}

module.exports = {
  lastId: lastId
}