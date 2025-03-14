import React from 'react';


const SubscriberList = ({ subscribers, onDelete }) => {
  return (
    <div className="subscriber-list">
      <table className="subscriber-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Subscribed At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.length > 0 ? (
            subscribers.map((subscriber) => (
              <tr key={subscriber._id}>
                <td>{subscriber.email}</td>
                <td>
                  {new Date(subscriber.subscribedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </td>
                <td>
                  <button
                    onClick={() => onDelete(subscriber._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="no-subscribers">
                No subscribers available at the moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriberList;
