import CreateEntryInput from "./CreateEntryInput";
import RecentActivityFeed from "./RecentActivityFeed";

const Dashboard = () => {
  return (<div className="w-full flex flex-col gap-8">
      <CreateEntryInput />
      <RecentActivityFeed />
    </div>);
};

export default Dashboard;
