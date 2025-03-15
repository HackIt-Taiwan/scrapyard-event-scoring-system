export function databasePost(path: string, data: object): Promise<Response> {
    return fetch(`${process.env.DATABASE_API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DATABASE_AUTH_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }
  
// Helper function to fetch team details
export async function getTeamDetails(teamId: string) {
  const response = await databasePost("/etc/get/team", {
    _id: teamId,
    ignore_encryption: {
      _id: true,
    },
  });
  
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!Array.isArray(data.data) || data.data.length === 0) {
    return {};
  }
  return data.data[0] || {};
}

// Helper function to fetch team members
export async function getMember(memberId: string) {
  const response = await databasePost("/etc/get/member", {
    _id: memberId,
    ignore_encryption: {
      _id: true,
    },
  });
  
  if (!response.ok) {
    return {};
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    return {}
  }
  return data.data[0] || {};
}
  