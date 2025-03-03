import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Campaign, Connection } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, TrendingUp, Users, BriefcaseIcon } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: [user?.userType === "company" ? "/api/campaigns/company" : "/api/campaigns"],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections/influencer"],
    enabled: user?.userType === "influencer",
  });

  if (campaignsLoading || connectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your {user?.userType === "company" ? "campaigns" : "partnerships"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.userType === "company" ? "Active Campaigns" : "Active Partnerships"}
            </CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.userType === "company" 
                ? campaigns?.filter(c => c.status === "active").length
                : connections?.filter(c => c.status === "accepted").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50K+</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.userType === "company" ? "Connected Influencers" : "Brand Connections"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections?.length || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="grid gap-4">
          {user?.userType === "company" ? (
            campaigns?.slice(0, 5).map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  </div>
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            connections?.slice(0, 5).map((connection) => (
              <Card key={connection.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="https://images.unsplash.com/photo-1481277542470-605612bd2d61" />
                      <AvatarFallback>BR</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">Campaign #{connection.campaignId}</h3>
                      <p className="text-sm text-muted-foreground">Connected on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={connection.status === "accepted" ? "default" : "secondary"}>
                    {connection.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
