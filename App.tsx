import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import FoodWasteModule from './components/FoodWasteModule';
import AgricultureModule from './components/AgricultureModule';
import PollutionModule from './components/PollutionModule';
import { ModuleType } from './types';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);

  const renderModule = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD:
        return <Dashboard />;
      case ModuleType.FOOD_WASTE:
        return <FoodWasteModule />;
      case ModuleType.AGRICULTURE:
        return <AgricultureModule />;
      case ModuleType.POLLUTION:
        return <PollutionModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} setModule={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
};

export default App;
